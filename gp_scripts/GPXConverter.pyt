import arcpy
import os
import glob



class Toolbox(object):
    
    def __init__(self):
        self.label = "GPXConverter"
        self.alias = "GPXConverter"

        # List of tool classes associated with this toolbox
        self.tools = [GPXConverter]

class GPXConverter(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "GPXConverter"
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
        gpx_dir = r"c:\seasketch\safe_passages\gpx_dir\*.gpx"
        output_gpx_dir = r"c:\seasketch\safe_passages\gpx_output.gdb"
        try:
            gpx_files = glob.glob(gpx_dir)
            for gpx_file in gpx_files:
   
                
                filedesc = arcpy.Describe(gpx_file)
                basename = filedesc.basename
                
                output_dir = os.path.join(output_gpx_dir, basename)
                arcpy.GPXtoFeatures_conversion(gpx_file, output_dir);
                '''
                wgs_sr = arcpy.SpatialReference(4326)
                arcpy.env.outputCoordinateSystem = wgs_sr
                '''
        except StandardError, e:
            arcpy.AddError(e)
        return

