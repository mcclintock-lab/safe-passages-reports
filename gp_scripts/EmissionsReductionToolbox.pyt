import arcpy
import sp

NEW_LENGTH = "NEWLENGTH"
DEBUG = True
DEFAULT_SPEED = 14
LBS_PER_METRIC_TON = 2204.62
SHIPPING_LANE = "Shipping Lane"
SPEED_REDUCTION_ZONE = "Speed Reduction Zone"
MAX_SPEED_COL = "MAX_SPEED"
TOP_SPEED_COL = "TOP_SPEED"
CO2 = "CO2"
NOX = "NOX"
SOX = "SOX"
PM10 = "PM10"
class Toolbox(object):
    
    def __init__(self):
        self.label = "EmissionsReductionToolbox"
        self.alias = "EmissionsReductionToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [EmissionsReduction]

class EmissionsReduction(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "EmissionsReduction"
        self.description = ("Calculate emissions reductions with SRZs")
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

      emissions= arcpy.Parameter(
        displayName="Emissions",
        name="Emissions",
        datatype="GPRecordSet",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )


      params = [inputs, result_code, result_msg, emissions]
      return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True

    def updateMessages(self, parameters):
        return

    def isSRZ(self, feat):
        sketchid = sp.get_type(feat, "SC_ID")
        if sketchid == sp.MANAGEMENT_AREA_SCID:
            sketch_type = sp.get_type(feat, sp.TYPE_COL)
            return sketch_type == sp.SRZ_ATTR
        else:
            return False

        return False

    def execute(self, parameters, messages):
        arcpy.env.overwriteOutput = True
        all_inputs = parameters[0].values

        if DEBUG:
            reload(sp)
            
        returnCode = "0"
        returnMsg = ""
        #placeholders for now, fix these when we come up with real numbers
        cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)
        total_emissions = 0
        total_original_emissions = 0

        srzs = []
        shipping_lanes = {}
        results_dict = {}
        try:
            for i, feat in enumerate(all_inputs):
                sketch_type = sp.get_type(feat, "SC_NAME")

                if sketch_type == SHIPPING_LANE:
                    rep_in = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))

                    #need to get just one of the shipping lanes
                    target_column = self.get_target_column(rep_in)
                    arcpy.AddMessage("here...")
                    with arcpy.da.SearchCursor(rep_in, [target_column, "NAME"]) as cursor:
                        for row in cursor:
                            fid = row[0]
                            sl_layer = r"in_memory\in_mem_lane_{}_{}".format(i,fid)
                            name = row[1]
                            if shipping_lanes.get(name) is None:
                                where = self.get_where_clause(target_column, fid)
                                arcpy.AddMessage("now: {}; {} ".format(name, where))
                                arcpy.MakeFeatureLayer_management(rep_in, sl_layer, where_clause=where)
                                arcpy.AddMessage("and now...")
                                shipping_lanes[name] = sl_layer
                elif self.isSRZ(feat):
                    reprojected_input = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                    srzs.append(reprojected_input)

            if(len(srzs) > 0):
                arcpy.AddMessage("has srzs: {}".format(len(srzs)))
                unioned_srzs = "in_memory\unioned_srzs"
                arcpy.Union_analysis(srzs, unioned_srzs)
                arcpy.AddField_management(unioned_srzs, TOP_SPEED_COL, "TEXT")
                with arcpy.da.UpdateCursor(unioned_srzs, ["*"]) as cursor:
                    for row in cursor:
                        max_speed = 0
                        top_speed_col = -1
                        #get the high speed for all overlapping speed reduction zones, and use it
                        for j, val in enumerate(row):
                            if(cursor.fields[j].startswith(MAX_SPEED_COL)):
                                try:
                                    currmax = int(row[j])
                                except StandardError:
                                    currmax = 0
                                if currmax > max_speed:
                                    max_speed = currmax
                            elif cursor.fields[j] == TOP_SPEED_COL:
                                top_speed_col = j
                        if top_speed_col >= 0:
                            row[top_speed_col] = max_speed
                            cursor.updateRow(row)

                i=0
                arcpy.AddMessage("about to calc")

                for shipping_lane_id, shipping_lane in shipping_lanes.items():
                    ship_and_zones = r"in_memory\ship_and_zones_{}".format(i)
                    arcpy.Union_analysis([shipping_lane, unioned_srzs], ship_and_zones)
                    with arcpy.da.SearchCursor(ship_and_zones, ["*"]) as cursor:
                        returnMsg="fields: {}".format(cursor.fields)
                    #orig_emissions = self.get_default_shipping_lane_emissions(shipping_lane)
                    orig_emissions = self.get_original_shipping_lane_emissions(shipping_lane)
                    total_new_emissions = self.get_new_shipping_lane_emissions(ship_and_zones)
                    returnMsg="{}; length: {}".format(returnMsg, total_new_emissions.get("LENGTH"))

                    results_dict[shipping_lane_id] = [total_new_emissions, orig_emissions]
                    i+=1
            else:
                returnMsg+=("no speed reduction zones")
                for name, shipping_lane_layer in shipping_lanes.items():
                    arcpy.AddMessage("shipping_lane is {}".format(shipping_lane_layer))
                    #shipping_lane_id = sp.get_type(shipping_lane, "NAME")
                    emissions = self.get_default_shipping_lane_emissions(shipping_lane_layer)
                    orig_emissions = self.get_original_shipping_lane_emissions(shipping_lane_layer)
                    results_dict[name] = [emissions, orig_emissions]

            arcpy.AddMessage("{}".format(returnMsg))
            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)
            self.write_results(results_dict)

            if DEBUG:
                arcpy.AddMessage("total_emissions: {}".format(total_emissions))
                arcpy.AddMessage("total_emissions: {}".format(total_original_emissions))

        except StandardError, e:
            arcpy.AddError(e)
        return

    def write_results(self, results_dict):
        out_table = sp.create_inmemory_text_table("emissions_red_out", ["NAME","NEW_OR_OLD", "CO2","NOX", "SOX","PM10"])
        fid = 0
        with arcpy.da.InsertCursor(out_table, ["*"]) as cursor:
            for shipping_lane, value_arr in results_dict.items():
                new_emissions = value_arr[0]
                orig_emissions = value_arr[1]
                orig_co2 = orig_emissions.get(CO2)
                orig_nox = orig_emissions.get(NOX)
                orig_sox = orig_emissions.get(SOX)
                orig_pm10 = orig_emissions.get(PM10)
                orig_row = [fid, shipping_lane, "ORIG", round(orig_co2,3), 
                            round(orig_nox,3), round(orig_sox,3), round(orig_pm10,3)]
                fid+=1

                new_co2 = new_emissions.get(CO2)
                new_nox = new_emissions.get(NOX)
                new_sox = new_emissions.get(SOX)
                new_pm10 = new_emissions.get(PM10)
                new_row = [fid, shipping_lane, "NEW", round(new_co2,3), 
                            round(new_nox,3), round(new_sox,3), round(new_pm10,3)]
                fid+=1

                perc_co2 = round(((orig_co2 - new_co2)/new_co2)*100,1)
                perc_nox = round(((orig_nox - new_nox)/new_nox)*100,1)
                perc_sox = round(((orig_sox - new_sox)/new_sox)*100,1)
                perc_pm10 = round(((orig_pm10 - new_pm10)/new_pm10)*100,1)

                perc_row = [fid, shipping_lane, "PERC", perc_co2, perc_nox, perc_sox, perc_pm10]
                fid+=1
                cursor.insertRow(orig_row)
                cursor.insertRow(new_row)
                cursor.insertRow(perc_row)

        emissions_rs = arcpy.RecordSet()
        emissions_rs.load(out_table)
        arcpy.SetParameter(3, emissions_rs)

        if DEBUG:
            arcpy.AddMessage("total emissions: {}".format(arcpy.Describe(emissions_rs).pjson))

    def get_new_shipping_lane_emissions(self, ship_and_zones):
        arcpy.AddMessage("getting new shipping lane emission")
        total_new_co2 = 0
        total_new_nox = 0
        total_new_sox = 0
        total_new_pm10 = 0
        total_length = 0
        with arcpy.da.SearchCursor(ship_and_zones, ["SHAPE@LENGTH",  TOP_SPEED_COL, "NLanes"]) as cursor:
            for x,row in enumerate(cursor):
                if(row[2] is None or len(str(row[2]).strip()) == 0 or int(row[2]) <= 0):
                    arcpy.AddMessage("skipping row: {}".format(x))
                    continue

                speed = int(row[1] or 0)
                #use default top speed for areas outside srzs
                if speed == 0:
                    speed = DEFAULT_SPEED

                length = self.get_length_in_nm(row[0])

                total_length+=length

                co2_for_speed = self.get_co2_per_nautical_mile(speed)
                new_co2_emissions = length*co2_for_speed
                total_new_co2+=new_co2_emissions

                nox_for_speed = self.get_nox_per_nautical_mile(speed)
                new_nox_emissions = (length*nox_for_speed)/LBS_PER_METRIC_TON
                total_new_nox+=new_nox_emissions

                sox_for_speed = self.get_sox_per_nautical_mile(speed)
                new_sox_emissions = (length*sox_for_speed)/LBS_PER_METRIC_TON
                total_new_sox+=new_sox_emissions

                pm_for_speed = self.get_pm_per_nautical_mile(speed)
                new_pm_emissions = (length*pm_for_speed)/LBS_PER_METRIC_TON
                total_new_pm10+= new_pm_emissions
        arcpy.AddMessage("total length: {}".format(total_length))
        return {CO2: total_new_co2, NOX: total_new_nox, SOX: total_new_sox, PM10: total_new_pm10, "LENGTH":total_length}

    def get_length_in_nm(self, length_val):
        length_in_m = (length_val-(1852*2))/2
        length = length_in_m*0.00062137
        return length
    def get_original_shipping_lane_emissions(self, in_feature):
        length = 158.35
        speed = DEFAULT_SPEED

        co2_for_speed = self.get_co2_per_nautical_mile(speed)
        new_co2_emissions = length*co2_for_speed

        nox_for_speed = self.get_nox_per_nautical_mile(speed)
        new_nox_emissions = (length*nox_for_speed)/LBS_PER_METRIC_TON

        sox_for_speed = self.get_sox_per_nautical_mile(speed)
        new_sox_emissions = (length*sox_for_speed)/LBS_PER_METRIC_TON

        pm_for_speed = self.get_pm_per_nautical_mile(speed)
        new_pm_emissions = (length*pm_for_speed)/LBS_PER_METRIC_TON

        return {CO2: new_co2_emissions, NOX: new_nox_emissions, SOX: new_sox_emissions, PM10: new_pm_emissions}
    def get_default_shipping_lane_emissions(self, in_feature):
        length = self.get_new_length(in_feature)
        arcpy.AddMessage("getting default length: {}".format(length))
        new_co2_emissions = 0
        new_nox_emissions = 0
        new_sox_emissions = 0
        new_pm_emissions = 0

        speed = DEFAULT_SPEED

        co2_for_speed = self.get_co2_per_nautical_mile(speed)
        new_co2_emissions = length*co2_for_speed

        nox_for_speed = self.get_nox_per_nautical_mile(speed)
        new_nox_emissions = (length*nox_for_speed)/LBS_PER_METRIC_TON

        sox_for_speed = self.get_sox_per_nautical_mile(speed)
        new_sox_emissions = (length*sox_for_speed)/LBS_PER_METRIC_TON

        pm_for_speed = self.get_pm_per_nautical_mile(speed)
        new_pm_emissions = (length*pm_for_speed)/LBS_PER_METRIC_TON

        return {CO2: new_co2_emissions, NOX: new_nox_emissions, SOX: new_sox_emissions, PM10: new_pm_emissions}

    def get_speed(self, in_feature):
        try:
            speed = sp.get_speed(in_feature)
            return speed
        except StandardError:
            arcpy.AddMessage("couldn't find speed, using default of {}".format(DEFAULT_SPEED))
            return DEFAULT_SPEED

    def get_co2_per_nautical_mile(self, speed):
        #metric tons per nautical mile
        nautical_dict = {10:0.12, 12:0.17, 14:0.23, 16:0.30, 18:0.38}
        val = nautical_dict.get(speed)
        return val
       
    def get_nox_per_nautical_mile(self, speed):
        nox_dict = {10:7.40, 12:10.65,14:14.50,16:18.94,18:23.97}
        return nox_dict.get(speed)

    def get_sox_per_nautical_mile(self, speed):
        sox_dict = {10:0.16, 12:0.23, 14:0.31,16:0.40, 18:0.51}
        return sox_dict.get(speed)

    def get_pm_per_nautical_mile(self, speed):
        pm_dict = {10:0.11, 12:0.16, 14:0.21, 16:0.28, 18:0.35}
        return pm_dict.get(speed)

    def get_target_column(self, input_feature):
        with arcpy.da.SearchCursor(input_feature, ["*"]) as cursor:
            for fld in cursor.fields:
                arcpy.AddMessage("field: {}".format(fld))
                if str(fld) == "FID":
                    return "FID"
                
        return "ID"

    def get_separation(self, in_feature):
        try:
            with arcpy.da.SearchCursor(in_feature, ["SIDE", "SEPARATION"]) as cursor:
                for row in cursor:
                    if len(str(row[0])) != 0:
                        return 1852*(row[1])
        except StandardError:
            return 1852

    def get_new_length(self, in_feature):
        try:
            longest_edge = 0.0
            with arcpy.da.SearchCursor(in_feature, ["SHAPE@LENGTH"]) as cursor:
                for row in cursor:
                    if float(row[0]) > longest_edge:
                        #this is the perimeter for the first feature
                        longest_edge=row[0]
                    
      
            #sides are 1 nautical mile long long, so 1852 meters
            return self.get_length_in_nm(longest_edge)
            
        except StandardError, e:
            arcpy.AddMessage("problem getting length: {}".format(e))
            return 0.0

    def get_where_clause(self, target_column, target_id):
        if target_column == "FID":
            where = " \"{}\"  = {}".format(target_column, target_id)
        else:
            where = " \"{}\"  = \'{}\'".format(target_column, target_id)

        return where