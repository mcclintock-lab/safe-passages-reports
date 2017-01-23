import arcpy
import sp

DEBUG=True
SQ_M_TO_SQ_MILES = 3.86102e-7
SP_COL = "Species"
FREQ_COL = "FREQUENCY"
TOT_COL = "count_tot"
PERC_COL = "count_perc"
INSIDE_AREA_THRESHOLD = 0.50
NA = "N/A"
BLUE_WHALE = 'Blue whale'
HAS_INVALID = "HAS_INV"
class Toolbox(object):
    
    def __init__(self):
        self.label = "WhaleOverlapToolbox"
        self.alias = "WhaleOverlapToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [WhaleOverlapTool]

class WhaleOverlapTool(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "WhaleOverlapTool"
        self.description = ("Calculate the whale overlap.")
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
        displayName="WhaleCount",
        name="WhaleCount",
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
    
    def get_bia_total_areas(self):
        #total area of each BIA in meters
        return {'Gray whale': 131228046308.09186, 'Harbor porpoise': 1039708543.216924, 'Humpback whale': 3281945625.209791, 'Blue whale': 7274116450.6390085}

    def dump_count_totals(self):
        in_whales = r"channel_data\whales_ta.shp"
        tot_dict = {}
        with arcpy.da.SearchCursor(in_whales, ["Species", "Number"]) as cursor:
            for row in cursor:
                spec = row[0]
                num = int(row[1])
                if tot_dict.get(spec) is None:
                    tot_dict[spec] = num
                else:
                    tot_dict[spec] = num+tot_dict.get(spec)
        arcpy.AddMessage("{}".format(tot_dict))

    def get_count_totals(self):
        return {u'Blue': 6094, u'Gray': 10339, u'Pilot Whale': 3, u'Sperm': 7, u'Minke': 385, u'Humpback': 8554, u'Fin': 121, u'Sei': 1}
    
    def get_na_dict(self):
        return {u'Blue': NA, u'Gray': NA, u'Pilot Whale': NA, u'Sperm': NA, u'Minke': NA, u'Humpback': NA, u'Fin': NA, u'Sei': NA}
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
        return ((intsct_area/original_area) > INSIDE_AREA_THRESHOLD)

    def execute(self, parameters, messages):
        arcpy.env.overwriteOutput = True
        all_inputs = parameters[0].values

        if DEBUG:
            reload(sp)
            
        returnCode = "0"
        returnMsg = ""
        #placeholders for now, fix these when we come up with real numbers
        cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)

        in_whales = r"whales_ta.shp"
        tol = "0.001 NauticalMiles"
        
        whale_sightings_totals = self.get_count_totals()
        all_whale_counts = {}
        invalid_ids = {}
        try:
            for i, feat in enumerate(all_inputs):
                valid_layers = []
                invalid_layers = []
                sketch_id = sp.get_sketch_id(feat) 
                target_column = sp.get_target_column(feat)  
                rep_in = sp.reproject(feat, cateal_sr, i, "emissions"+str(i)) 

                with arcpy.da.SearchCursor(rep_in, [target_column, sp.AREA_FIELD]) as cursor:
                    for row in cursor:
                        fid = row[0]
                        sl_layer = r"in_memory\in_mem_lane_{}".format(fid)
                        sketch_area = row[1]
                        if sketch_area is None:
                            sketch_area = 0.0
                        where = sp.get_where_clause(target_column, fid)
                        arcpy.MakeFeatureLayer_management(rep_in, sl_layer, where_clause=where)
                        if self.is_inside_whale_area(sl_layer):
                            valid_layers.append(sl_layer)
                        else:
                            invalid_layers.append(sl_layer)

                diss_in = r"in_memory\diss_sens_{}".format(i)
                merged_valid_layers = r"in_memory\merged_layers_{}".format(i)

                if len(valid_layers) == 0:
                    arcpy.AddMessage("only invalid")
                    all_whale_counts[sketch_id] = self.get_na_dict()
                else:
                    arcpy.AddMessage("has valid layers")
                    whale_counts = {}
                    sightings = r"in_memory\whale_sightings_{}".format(i)
                    whalecount = r"in_memory\whalecount_{}".format(i)
                    arcpy.Merge_management(valid_layers, merged_valid_layers)
                    arcpy.Dissolve_management(merged_valid_layers, diss_in)
                    arcpy.Intersect_analysis([diss_in, in_whales],sightings,"ALL",tol)
                    sightings_data = SP_COL
                    arcpy.Frequency_analysis(sightings,whalecount,sightings_data)

                    #summing for everything in a collection of zones
                    self.add_to_whalecounts(whalecount, whale_counts)
                    all_whale_counts[sketch_id] = whale_counts

                invalid_ids[sketch_id] = len(invalid_layers)

            cols = [SP_COL, FREQ_COL, TOT_COL, PERC_COL, HAS_INVALID, sp.FIELD_SC_ID]
            out_table = sp.create_inmemory_text_table("out_whalecount", cols)
            with arcpy.da.InsertCursor(out_table, cols) as cursor:
                for sketch_id, whale_counts in all_whale_counts.items():
                    invalid_layer_count = invalid_ids.get(sketch_id)
                    for species, frequency in whale_counts.items():
                        arcpy.AddMessage("freq: {}".format(frequency))
                        if frequency == NA:
                            if invalid_layer_count is None or invalid_layer_count > 0:
                                has_invalid = True
                            else:
                                has_invalid = False
                            row = [species, NA,NA,NA, has_invalid, sketch_id]
                            cursor.insertRow(row)
                        else:
                            tot = whale_sightings_totals.get(species)
                            if tot is None or tot == 0:
                                tot = 0
                                perc = 0
                            else:
                                perc = round((float(frequency)/float(tot))*100,1)
                                
                            if invalid_layer_count is None or invalid_layer_count > 0:
                                has_invalid = True
                            else:
                                has_invalid = False

                            row = [species, frequency,tot,perc, has_invalid, sketch_id]
                            cursor.insertRow(row)

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

    def add_to_whalecounts(self, whalecount_freq, whale_counts):
        with arcpy.da.SearchCursor(whalecount_freq, [FREQ_COL, SP_COL]) as cursor:
            for row in cursor:
                num = row[0]
                species = row[1]
                num_found_already = whale_counts.get(species)
                if num_found_already is None:
                    whale_counts[species] = num
                else:
                    whale_counts[species] = num+num_found_already