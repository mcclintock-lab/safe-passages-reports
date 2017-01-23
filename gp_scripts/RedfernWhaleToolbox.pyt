import arcpy
import sp

DEBUG=True
SQ_M_TO_SQ_MILES = 3.86102e-7
SP_COL = "cmn_name"
AREA_COL = "Area"
TOTAL_COL = "TotalArea"
FIN_WHALE = 'Fin whale'
HUMPBACK_WHALE = 'Humpback whale'
BLUE_WHALE = 'Blue whale'
INSIDE_AREA_THRESHOLD = 0.75
NA = "NA"
class Toolbox(object):
    
    def __init__(self):
        self.label = "RedfernWhaleToolbox"
        self.alias = "RedfernWhaleToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [RedfernWhaleToolbox]

class RedfernWhaleToolbox(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "RedfernWhaleToolbox"
        self.description = ("Calculate the redfern whale overlap.")
        self.canRunInBackground = False
        
    def getParameterInfo(self):
      inputs = arcpy.Parameter(
        displayName="AllInputs",
        name="AllInputs",
        datatype="Feature Class",
        multiValue=True,
        parameterType="Required",
        direction="Input" )



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

      redfern = arcpy.Parameter(
        displayName="RedfernWhale",
        name="RefernWhale",
        datatype="GPRecordSet",
        multiValue=True,
        parameterType="Derived",
        direction="Output" )

      ladd = arcpy.Parameter(
        displayName="LaddWhale",
        name="LaddWhale",
        datatype="GPRecordSet",
        multiValue=True,
        parameterType="Derived",
        direction="Output" )
      params = [inputs, result_code, result_msg, redfern, ladd]
      return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True


    def updateMessages(self, parameters):
        return


    def execute(self, parameters, messages):
        arcpy.env.overwriteOutput = True
        all_inputs = parameters[0].values

        if DEBUG:
            reload(sp)
            
        returnCode = "0"
        returnMsg = ""
        #placeholders for now, fix these when we come up with real numbers
        cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)

        blue_layer = r"redfern\blue_whale.shp"
        fin_layer =  r"redfern\fin_whale.shp"
        humpback_layer =  r"redfern\humpback_whale.shp"
        ladd_layer = r"ladd_whales.shp"
        
        blue_by_sketchid = {}
        fin_by_sketchid = {}
        humpback_by_sketchid = {}
        ladd_by_sketchid = {}
        sketch_ids = []
        try:
            for i, feat in enumerate(all_inputs):
                sketch_id = sp.get_sketch_id(feat)
                sketch_ids.append(sketch_id)

                reprojected_input = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                diss_in = r"in_memory\diss_sens_{}".format(i)
                arcpy.Dissolve_management(reprojected_input, diss_in)

                self.calc_whale_values(blue_by_sketchid, blue_layer, diss_in, BLUE_WHALE, sketch_id)
                self.calc_whale_values(fin_by_sketchid, fin_layer, diss_in, FIN_WHALE, sketch_id)
                self.calc_whale_values(humpback_by_sketchid, humpback_layer, diss_in, FIN_WHALE, sketch_id)
                self.calc_ladd_values(ladd_by_sketchid, ladd_layer, diss_in, sketch_id)

            out_table = self.write_redfern_results(blue_by_sketchid, fin_by_sketchid, humpback_by_sketchid, sketch_ids)
            whaleRS = arcpy.RecordSet()
            whaleRS.load(out_table)

            ladd_table = self.write_ladd_results(ladd_by_sketchid)
            arcpy.AddMessage("ladd table: {}".format(ladd_table))
            laddRS = arcpy.RecordSet()
            laddRS.load(ladd_table)

            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)
            arcpy.SetParameter(3, whaleRS)
            arcpy.SetParameter(4, laddRS)

            if DEBUG:
                arcpy.AddMessage("redfern: {}".format(arcpy.Describe(whaleRS).pjson))
                arcpy.AddMessage("ladd: {}".format(arcpy.Describe(laddRS).pjson))

        except StandardError, e:
            arcpy.AddError(e)
        return

    def calc_ladd_values(self, whale_dict, whale_feature, diss_in, sketch_id):
        int_values = r"in_memory\whale_ladd"
        whale_layer = r"in_memory\ladd_layer"
        arcpy.MakeFeatureLayer_management(whale_feature, whale_layer)
        arcpy.SelectLayerByLocation_management(whale_layer, "INTERSECT", diss_in)
        num_areas = int(arcpy.GetCount_management(whale_layer).getOutput(0) or 0)
        whale_dict[sketch_id] = num_areas

        arcpy.SelectLayerByAttribute_management(whale_layer, "CLEAR_SELECTION")
        del int_values
        del whale_layer

    def calc_whale_values(self, whale_dict, whale_layer, diss_in, species, sketch_id):
        tol = "0.001 NauticalMiles"
        int_values = r"in_memory\whale_redfern"
        arcpy.Intersect_analysis([diss_in, whale_layer], int_values, "ALL", tol)
        sketch_area = 0.0
        with arcpy.da.SearchCursor(int_values, [sp.AREA_FIELD ]) as cursor:
            for row in cursor:
                area = row[0]
                sqmi_area = (sp.SQ_METERS_TO_SQ_MILES*area)
                sketch_area += sqmi_area
        whale_dict[sketch_id] = sketch_area

        del int_values

    def write_ladd_results(self, whale_dict):
        cols = ["COUNT", sp.FIELD_SC_ID]
        out_table = sp.create_inmemory_text_table("out_ladd_count", cols)
        with arcpy.da.InsertCursor(out_table, cols) as cursor:
            for scid, count in whale_dict.items():
                cursor.insertRow([count, scid])
        return out_table

    def write_redfern_results(self, blue_by_sketchid, fin_by_sketchid, humpback_by_sketchid, sketch_ids):
        cols = ["BLUE_SQM", "BLUE_PERC", "FIN_SQM", "FIN_PERC", "HUMP_SQM", "HUMP_PERC", sp.FIELD_SC_ID]
        out_table = sp.create_inmemory_text_table("out_redfern", cols)
        total_dicts = self.get_redfern_total_areas()
        with arcpy.da.InsertCursor(out_table, cols) as cursor:
            for sid in sketch_ids:

                blue_area = blue_by_sketchid.get(sid)
                arcpy.AddMessage("writing blue")
                blue_total = total_dicts.get(BLUE_WHALE)
                arcpy.AddMessage("tot {}".format(blue_total))
                if blue_area is None:
                    blue_area = 0.0
                blue_perc = (blue_area/blue_total)*100

                fin_area = fin_by_sketchid.get(sid)
                fin_total = total_dicts.get(FIN_WHALE)

                if fin_area is None:
                    fin_area = 0.0
                fin_perc = (fin_area/fin_total)*100.0
                arcpy.AddMessage("fin?")

                hump_area = humpback_by_sketchid.get(sid)
                hump_total = total_dicts.get(HUMPBACK_WHALE)
                if hump_area is None:
                    hump_area = 0.0
                hump_perc = (hump_area/hump_total)*100.0

                arcpy.AddMessage("now done?")
                cursor.insertRow([blue_area, blue_perc, fin_area, fin_perc, hump_area, hump_perc, sid])
        return out_table

    def get_redfern_total_areas(self):
        #total area of each redfern area in square miles
        return {FIN_WHALE:6145.200656,  HUMPBACK_WHALE: 6151.384991, BLUE_WHALE:6142.11178}
