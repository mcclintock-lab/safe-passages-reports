import arcpy
import sp

DEBUG=True
SQ_M_TO_SQ_MILES = 3.86102e-7

class Toolbox(object):
    
    def __init__(self):
        self.label = "ZoneSizeToolbox"
        self.alias = "ZoneSizeToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [ZoneSize]

class ZoneSize(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "ZoneSize"
        self.description = ("Calculate the size (in square miles) and return values.")
        self.canRunInBackground = False
        
    def getParameterInfo(self):
      inputs = arcpy.Parameter(
        displayName="AllInputs",
        name="AllInputs",
        datatype="Feature Class",
        multiValue=True,
        parameterType="Required",
        direction="Input" )

      zonesize = arcpy.Parameter(
        displayName="Size",
        name="Size",
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
      
      params = [inputs, zonesize, result_code, result_msg]
      return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True


    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):
        arcpy.env.overwriteOutput = True
        cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)
        all_inputs = parameters[0].values
        if DEBUG:
            reload(sp)
            
        returnCode = "0"
        returnMsg = ""
        #placeholders for now, fix these when we come up with real numbers
        output_column_names = ["SIZE_SQMI", sp.FIELD_SC_ID]
        output_column_types = ["TEXT", "TEXT"]
        size_dict = {}

        try:
            for i, feat in enumerate(all_inputs):

                #NOTE: no reproject for now
                sketch_id = sp.get_sketch_id(feat)
                sketch_classname = sp.get_type(feat, "SC_NAME")
                if sketch_id == sp.SHIP_LANE_SCID:
                    #don't include shipping lane scid
                    continue
                rep_in = sp.reproject(feat, cateal_sr, i, "zonesize"+str(i))

                dissolve = r"in_memory\dissolve"+str(i)
                dissolved_input = arcpy.Dissolve_management(rep_in, dissolve, sp.FIELD_SC_ID)

                #add up the total size.
                shape_array = arcpy.da.FeatureClassToNumPyArray(dissolved_input, [sp.AREA_FIELD])
                area_sum = round(shape_array[sp.AREA_FIELD].sum()*SQ_M_TO_SQ_MILES, 2)
                id_size = size_dict.get(sketch_id)

                if id_size:
                    size_dict[sketch_classname] = id_size+area_sum
                else:
                    size_dict[sketch_classname] = area_sum

            result_table = sp.create_inmemory_table("size_table_".format(i), output_column_names, output_column_types)
            with arcpy.da.InsertCursor(result_table, output_column_names) as cursor:
                for sketch_name, size in size_dict.items():
                    row = [size, sketch_name]
                    cursor.insertRow(row)

            rs = arcpy.RecordSet()
            rs.load(result_table)
            arcpy.AddMessage(arcpy.Describe(rs).pjson)
            arcpy.SetParameter(1, rs)
            arcpy.SetParameter(2, returnCode)            
            arcpy.SetParameter(3, returnMsg)

        except StandardError, e:
            arcpy.AddError(e)
        return
