import arcpy
import sp

DEBUG = True
class Toolbox(object):
    
    def __init__(self):
        self.label = "ShippingLaneLengthForProposalToolbox"
        self.alias = "ShippingLaneLengthForProposalToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [ShippingLaneLengthForProposal]

class ShippingLaneLengthForProposal(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "ShippingLaneLengthForProposal"
        self.description = ("Report shipping lane report")
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

      lengths = arcpy.Parameter(
        displayName="Lengths",
        name="Lengths",
        datatype="GPRecordSet",
        multiValue=True,
        parameterType="Derived",
        direction="Output" )

      params = [inputs, result_code, result_msg, lengths]
      return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):

        try:
            if DEBUG:
                reload(sp)

            all_inputs = parameters[0].values
            #in_lanes = all_inputs[0]
            cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)
            returnCode = 0
            returnMsg = ""
            shipping_lanes = {}
            for i, feat in enumerate(all_inputs):
                sketch_id = sp.get_sketch_id(feat)
                if sketch_id == sp.SHIP_LANE_SCID:
                    rep_in = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                    
                    #need to get just one of the shipping lanes
                    target_column = sp.get_target_column(rep_in)
                    with arcpy.da.SearchCursor(rep_in, [target_column, "NAME"]) as cursor:
                        for row in cursor:

                            fid = row[0]
                            sl_layer = r"in_memory\in_mem_ln_{}".format(fid)
                            name = row[1]
                            if shipping_lanes.get(name) is None:
                                where = sp.get_where_clause(target_column, fid)
                                arcpy.MakeFeatureLayer_management(rep_in, sl_layer, where_clause=where)
                                length = self.get_new_length(sl_layer)
                                if length > 0:
                                    shipping_lanes[name] = length
                else:
                    arcpy.AddMessage("skipping non-shipping lane")
           
            cols = ["NAME", "NEW_LENGTH"]

            out_table = sp.create_inmemory_text_table("proposal_length_out", cols)
            with arcpy.da.InsertCursor(out_table, cols) as cursor:
                for name, length in shipping_lanes.items():
                    row = [name, length]
                    cursor.insertRow(row)

            rs = arcpy.RecordSet()
            rs.load(out_table)
            arcpy.AddMessage("results: {}".format(arcpy.Describe(rs).pjson))

            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)
            arcpy.SetParameter(3, rs)
        except StandardError, e:
            arcpy.AddError(e)

    def get_new_length(self, in_feature):
        try:
            longest_edge = 0.0
            with arcpy.da.SearchCursor(in_feature, ["SHAPE@LENGTH"]) as cursor:
                for row in cursor:
                    if float(row[0]) > longest_edge:
                        #this is the perimeter for the first feature
                        longest_edge=row[0]
                
            #sides are 1 nautical mile long long, so 1852 meters
            return sp.get_length_in_nm(longest_edge)
        except StandardError,e:
            arcpy.AddMessage("problem getting length: {}".format(e))
            return -1