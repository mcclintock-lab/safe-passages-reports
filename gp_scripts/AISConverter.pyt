import arcpy
import codecs
import os
import glob


FIELD_SKETCH_ID = "SC_ID"
DEBUG=True
EFFORT_FIELD = "EFFORT"
SCALED_EFFORT_FIELD = "SC_EFFORT"
BLOCK_ID_FIELD = "BLOCK_ID"

class Toolbox(object):
    
    def __init__(self):
        self.label = "AISConverter"
        self.alias = "AISConverter"

        # List of tool classes associated with this toolbox
        self.tools = [AISConverter]

class AISConverter(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "AISConverter"
        self.description = "Convert csv to point features"
        self.canRunInBackground = False
        
    def getParameterInfo(self):

        params = []
        return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True


    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):
        #mile_conversion = 1.1508
        arcpy.env.overwriteOutput = True
        #367104060;under way ;127°'; 0.1kt;34.288880N;119.585942W; 46.2°;036°;22s; 140106 000000;serial#1(A)[1]
        csv_dir = r"c:\seasketch\safe_passages\ais_2014\*.log"
        output_winter_dir = r"c:\seasketch\safe_passages\ais_winter.gdb"
        output_summer_dir =  r"c:\seasketch\safe_passages\ais_summer.gdb"
        try:
            csv_files = glob.glob(csv_dir)
            #368164000;under way ;000°';11.1kt;34.254705N;119.687512W;107.8°;104°;54s; 140113 000000;serial#1(B)[1]
            #636015281;(9301902);(A8ZR6  );FALCON NOSTOS;Tanker hazA;-> Jan24 15:00 CONCHAN PERU ;182 32 11.8 150 10; 140113 000008;serial#1(B)[5]
            
            fidval = 0
            i=0
            for csv_file in csv_files:
                i+=1
                
                fid_dict = {}
                filedesc = arcpy.Describe(csv_file)
                basename = filedesc.basename
                is_summer = self.is_summer(basename)
                arcpy.AddMessage("reading {}".format( csv_file));
                reader = codecs.open(csv_file, 'r', encoding='latin-1')
                for line in reader:
                    
                    try:
                        csv_row = line.split(";")
                        if len(csv_row) == 11:
                            mmsi_col = 0
                            lat_col = 4 
                            lon_col = 5
                            date_col = 9
                        else:
                            continue
                        mmsival = csv_row[mmsi_col].strip()
                        latval = csv_row[lat_col].strip()
                        lonval = csv_row[lon_col].strip()
                        latval = latval.replace("N", "")
                        lonval = lonval.replace("W", "")
                        lonval = "-"+lonval

                        timestamp = self.get_timestamp(csv_row[date_col])
                        thedate = timestamp[0]
                        thetime = timestamp[1]
                        #arcpy.AddMessage("the date is {}".format(thedate))
                        #arcpy.AddMessage("the time is {}".format(thetime))
                        if float(lonval) > 180.0 or float(latval) > 90.0:
                            continue
                        else:
                            fid_dict[fidval] = [mmsival, lonval, latval, thedate, thetime]

                    except StandardError, e:
                        err=True

                    fidval+=1

                #polar_sr = arcpy.SpatialReference("WGS 1984 Arctic Polar Stereographic")
                wgs_sr = arcpy.SpatialReference(4326)
                arcpy.env.outputCoordinateSystem = wgs_sr
                cols = ["mmsi","lon", "lat", "thedate", "thetime"]
                if is_summer:
                    out_dir = output_summer_dir
                else:
                    out_dir = output_winter_dir
                cname = basename.replace('-','_')
                output_class = arcpy.CreateFeatureclass_management(out_dir, cname, "POINT")

                arcpy.AddField_management(output_class, cols[0], "TEXT")
                arcpy.AddField_management(output_class, cols[1], "TEXT")
                arcpy.AddField_management(output_class, cols[2], "TEXT")
                arcpy.AddField_management(output_class, cols[3], "TEXT")
                arcpy.AddField_management(output_class, cols[4], "TEXT")
                cols.append("SHAPE@XY")

                with arcpy.da.InsertCursor(output_class, cols) as cursor:
                    try:
                        for key,val in fid_dict.items():
                            pnt = arcpy.Point()
                            pnt.X = float(val[1])
                            pnt.Y = float(val[2])
                            row = [str(val[0]), str(val[1]), str(val[2]), val[3], val[4], pnt]
                            cursor.insertRow(row)

                    except StandardError, e:
                        arcpy.AddMessage("ERROR: skipping {} because {}".format(key, e))

        except StandardError, e:
            arcpy.AddError(e)
        return

    def get_timestamp(self, datestamp):
        dt = datestamp.strip().split(" ")
        time = dt[1]
        hour = time[0:2]
        minute = time[2:4]
        sec = time[4:6]
        return [dt[0], hour+":"+minute+":"+sec]


    def is_summer(self, filename):
        datestr = filename.replace("shipplotter14", "")
        datestr = datestr.replace(".log", "")
        month = datestr[:2]
        if month == "06" or month == "07" or month == "08" or month == "09":
            return True
        else:
            return False