import arcpy
import sp

DEBUG = True

class Toolbox(object):
    
    def __init__(self):
        self.label = "WhalesToolbox"
        self.alias = "WhalesToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [Whales]

class Whales(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Whales"
        self.description = ("Calculate whales")
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
        direction="Output" ),

      whales= arcpy.Parameter(
        displayName="WhaleCount",
        name="WhaleCount",
        datatype="GPRecordSet",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )
      
      params = [inputs, result_code, result_msg, whales]
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

        in_whales = r"channel_data\whales.shp"
        tol = "0.001 NauticalMiles"
        total_whales = 0
        try:
            for i, feat in enumerate(all_inputs):
                #sketch_id = sp.get_sketch_id(all_inputs[i])
                output = r"in_memory\whale_sightings_{}".format(i)
                reprojected_input = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                arcpy.Intersect_analysis([reprojected_input,in_whales],output,"ALL",tol)
                numwhales = int(arcpy.GetCount_management(output).getOutput(0) or 0)

            arcpy.AddMessage("total whales: {}".format(numwhales))
            return
            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)
            arcpy.SetParameter(3, total_whales)

            if DEBUG:
                arcpy.AddMessage("num whales: {}".format(total_whales))
                

        except StandardError, e:
            arcpy.AddError(e)
        return
