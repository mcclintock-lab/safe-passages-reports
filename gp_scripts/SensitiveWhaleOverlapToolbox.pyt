import arcpy
import sp

DEBUG=True
SQ_M_TO_SQ_MILES = 3.86102e-7
SP_COL = "cmn_name"
AREA_COL = "Area"
TOTAL_COL = "TotalArea"
GRAY_WHALE = 'Gray whale'
HUMPBACK_WHALE = 'Humpback whale'
BLUE_WHALE = 'Blue whale'
INSIDE_AREA_THRESHOLD = 0.75
NA = "NA"
class Toolbox(object):
    
    def __init__(self):
        self.label = "SensitiveWhaleOverlapToolbox"
        self.alias = "SensitiveWhaleOverlapToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [SensitiveWhaleOverlap]

class SensitiveWhaleOverlap(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "SensitiveWhaleOverlap"
        self.description = ("Calculate the sensitive whale species overlap.")
        self.canRunInBackground = False
        
    def getParameterInfo(self):
      inputs = arcpy.Parameter(
        displayName="AllInputs",
        name="AllInputs",
        datatype="Feature Class",
        multiValue=True,
        parameterType="Required",
        direction="Input" )

      whales = arcpy.Parameter(
        displayName="SensitiveWhale",
        name="SensitiveWhale",
        datatype="GPRecordSet",
        multiValue=True,
        parameterType="Derived",
        direction="Output" )

      result_code = arcpy.Parameter(
        displayName="ResultCode",
        name="ResultCode",
        datatype="Long",
        parameterType="Derived",
        direction="Output" )

      result_msg = arcpy.Parameter(
        displayName="ResultMsg",
        name="ResultMsg",
        datatype="String",
        parameterType="Derived",
        direction="Output" )
      
      params = [inputs, result_code, result_msg, whales]
      return params
    
    def get_sensitive_total_areas(self):
        #total area of each BIA in meters
        return {GRAY_WHALE: 131228046308.09186,  HUMPBACK_WHALE: 3281945625.209791, BLUE_WHALE: 7274116450.6390085}

    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True


    def updateMessages(self, parameters):
        return


    def is_inside_whale_area(self, input_feature):
        whale_area = r"whale_watch_effort_bounds.shp"
        original_area = sp.get_feature_class_area(input_feature, 6, sp.SQ_METERS_TO_SQ_KM)

        intsct_data = sp.do_intersect_inmemory(input_feature, whale_area, "intersect_area" )
        intsct_area = sp.get_feature_class_area(intsct_data, 6, sp.SQ_METERS_TO_SQ_KM)

        del intsct_data
        arcpy.AddMessage("intsct area: {}; orig area: {}; fraction: {}".format(intsct_area, original_area, INSIDE_AREA_THRESHOLD))
        return ((intsct_area/original_area) < INSIDE_AREA_THRESHOLD)

    def execute(self, parameters, messages):
        arcpy.env.overwriteOutput = True
        all_inputs = parameters[0].values

        if DEBUG:
            reload(sp)
            
        returnCode = "0"
        returnMsg = ""
        #placeholders for now, fix these when we come up with real numbers
        cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)

        bia_layer = r"cetmap_sp.shp"
        tol = "0.001 NauticalMiles"
        sensitive_species_by_sketchid = {}
        try:
            for i, feat in enumerate(all_inputs):
                sketch_id = sp.get_sketch_id(feat)
                sketch_dict = {BLUE_WHALE: 0.0, HUMPBACK_WHALE:0.0, GRAY_WHALE: 0.0}
                reprojected_input = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                diss_in = r"in_memory\diss_sens_{}".format(i)
                arcpy.Dissolve_management(reprojected_input, diss_in)
                '''
                if self.is_inside_whale_area(diss_in):
                    arcpy.AddMessage("its outside area")
                    #set them to be NAs
                    sensitive_species_by_sketchid[sketch_id] = {BLUE_WHALE: NA, HUMPBACK_WHALE:NA, GRAY_WHALE: NA}
                else:
                '''
                arcpy.AddMessage("its inside area for whales")
                bia_values = r"in_memory\whale_sightings_{}".format(i)
                arcpy.Intersect_analysis([diss_in, bia_layer], bia_values, "ALL", tol)
                with arcpy.da.SearchCursor(bia_values, [SP_COL, sp.AREA_FIELD ]) as cursor:
                    for row in cursor:
                        species = row[0]
                        area = row[1]
                        curr_area = sketch_dict.get(species)
                        if curr_area is None:
                            curr_area = 0
                        sketch_dict[species] = curr_area+area
                sensitive_species_by_sketchid[sketch_id] = sketch_dict

            cols = ["BLUE_SQM", "BLUE_PERC", "GRAY_SQM", "GRAY_PERC", "HUMP_SQM", "HUMP_PERC", sp.FIELD_SC_ID]
            out_table = sp.create_inmemory_text_table("out_whalecount", cols)
            total_dicts = self.get_sensitive_total_areas()
            with arcpy.da.InsertCursor(out_table, cols) as cursor:
                for sketch_id, sketch_dict in sensitive_species_by_sketchid.items():

                    blue_val = sketch_dict.get(BLUE_WHALE)
                    if blue_val == NA:
                        cursor.insertRow([NA, NA, NA, NA, NA, NA, sketch_id])
                    else:
                        blue_tot = total_dicts.get(BLUE_WHALE)
                        blue_perc = round((blue_val/blue_tot)*100,2)
                        blue_val = round(blue_val*sp.SQ_METERS_TO_SQ_MILES,1)

                        gray_val = sketch_dict.get(HUMPBACK_WHALE)
                        gray_tot = total_dicts.get(GRAY_WHALE)
                        gray_perc = round((gray_val/gray_tot)*100,2)
                        gray_val = round(gray_val*sp.SQ_METERS_TO_SQ_MILES,1)

                        humpback_val = sketch_dict.get(HUMPBACK_WHALE)
                        humpback_tot = total_dicts.get(HUMPBACK_WHALE)
                        humpback_perc = round((humpback_val/humpback_tot)*100,2)
                        humpback_val = round(humpback_val*sp.SQ_METERS_TO_SQ_MILES,1)
                        cursor.insertRow([blue_val, blue_perc, gray_val, gray_perc, humpback_val, humpback_perc, sketch_id])

            whaleRS = arcpy.RecordSet()
            whaleRS.load(out_table)
            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)
            arcpy.SetParameter(3, whaleRS)

            if DEBUG:
                arcpy.AddMessage("num whales: {}".format(arcpy.Describe(whaleRS).pjson))
                

        except StandardError, e:
            arcpy.AddError(e)
        return
