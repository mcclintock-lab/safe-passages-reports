import arcpy
import sp

NEW_LENGTH = "NEWLENGTH"
DEBUG = True
DEFAULT_SPEED = 16
LBS_PER_METRIC_TON = 2204.62
class Toolbox(object):
    
    def __init__(self):
        self.label = "EmissionsToolbox"
        self.alias = "EmissionsToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [Emissions]

class Emissions(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Emissions"
        self.description = ("Calculate emissions")
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


      new_co2_emissions= arcpy.Parameter(
        displayName="NewCO2",
        name="NewCO2",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      orig_co2_emissions= arcpy.Parameter(
        displayName="OrigCO2",
        name="OrigCO2",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      new_nox_emissions= arcpy.Parameter(
        displayName="NewNOX",
        name="NewNOX",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      orig_nox_emissions= arcpy.Parameter(
        displayName="OrigNOX",
        name="OrigNOX",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      new_sox_emissions= arcpy.Parameter(
        displayName="NewSOX",
        name="NewSOX",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      orig_sox_emissions= arcpy.Parameter(
        displayName="OrigSOX",
        name="OrigSOX",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      new_pm_emissions= arcpy.Parameter(
        displayName="NewPM",
        name="NewPM",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      orig_pm_emissions= arcpy.Parameter(
        displayName="OrigPM",
        name="OrigPM",
        datatype="GPDouble",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )
      
      params = [inputs, result_code, result_msg, new_co2_emissions, orig_co2_emissions, 
                new_nox_emissions, orig_nox_emissions,new_sox_emissions, orig_sox_emissions, new_pm_emissions, orig_pm_emissions]
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

        original_length = 158.35
        try:
            for i, feat in enumerate(all_inputs):
                #sketch_id = sp.get_sketch_id(all_inputs[i])
                reprojected_input = sp.reproject(feat, cateal_sr, i, "emissions"+str(i))
                length = self.get_new_length(reprojected_input)
                speed = self.get_speed(reprojected_input)
                
                co2_for_speed = self.get_co2_per_nautical_mile(speed)
                new_co2_emissions = length*co2_for_speed
                orig_co2_emissions = original_length*co2_for_speed

                nox_for_speed = self.get_nox_per_nautical_mile(speed)
                new_nox_emissions = (length*nox_for_speed)/LBS_PER_METRIC_TON
                orig_nox_emissions = (original_length*nox_for_speed)/LBS_PER_METRIC_TON

                sox_for_speed = self.get_sox_per_nautical_mile(speed)
                new_sox_emissions = (length*sox_for_speed)/LBS_PER_METRIC_TON
                orig_sox_emissions = (original_length*sox_for_speed)/LBS_PER_METRIC_TON

                pm_for_speed = self.get_pm_per_nautical_mile(speed)
                new_pm_emissions = (length*pm_for_speed)/LBS_PER_METRIC_TON
                orig_pm_emissions = (original_length*pm_for_speed)/LBS_PER_METRIC_TON

            arcpy.SetParameter(1, returnCode)            
            arcpy.SetParameter(2, returnMsg)

            arcpy.SetParameter(3, new_co2_emissions)
            arcpy.SetParameter(4, orig_co2_emissions)

            arcpy.SetParameter(5, new_nox_emissions)
            arcpy.SetParameter(6, orig_nox_emissions)            

            arcpy.SetParameter(7, new_sox_emissions)
            arcpy.SetParameter(8, orig_sox_emissions)

            arcpy.SetParameter(9, new_pm_emissions)
            arcpy.SetParameter(10, orig_pm_emissions)

            if DEBUG:
                arcpy.AddMessage("co2 new: {}".format(new_co2_emissions))
                arcpy.AddMessage("co2 orig: {}".format(orig_co2_emissions))

                arcpy.AddMessage("nox new: {}".format(new_nox_emissions))
                arcpy.AddMessage("nox orig: {}".format(orig_nox_emissions))

                arcpy.AddMessage("sox new: {}".format(new_sox_emissions))
                arcpy.AddMessage("sox orig: {}".format(orig_sox_emissions)) 

                arcpy.AddMessage("pm`new: {}".format(new_pm_emissions))
                arcpy.AddMessage("pm orig: {}".format(orig_pm_emissions))                             

        except StandardError, e:
            arcpy.AddError(e)
        return

    def get_speed(self, in_feature):
        try:
            speed = sp.get_speed(in_feature)
            return speed
        except StandardError:
            arcpy.AddMessage("couldn't find speed, using default of {}".format(DEFAULT_SPEED))
            return DEFAULT_SPEED

    def get_co2_per_nautical_mile(self, speed):
        #metric tons per nautical mile
        co_dict = {10:0.12, 12:0.17, 14:0.23, 16:0.30, 18:0.38}
        return co_dict.get(speed)
       
    def get_nox_per_nautical_mile(self, speed):
        nox_dict = {10:7.40, 12:10.65,14:14.50,16:18.94,18:23.97}
        return nox_dict.get(speed)

    def get_sox_per_nautical_mile(self, speed):
        sox_dict = {10:0.16, 12:0.23, 14:0.31,16:0.40, 18:0.51}
        return sox_dict.get(speed)

    def get_pm_per_nautical_mile(self, speed):
        pm_dict = {10:0.11, 12:0.16, 14:0.21, 16:0.28, 18:0.35}
        return pm_dict.get(speed)

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
            with arcpy.da.SearchCursor(in_feature, ["SHAPE@LENGTH"]) as cursor:
                for row in cursor:
                    #this is the perimeter for the first feature
                    longest_edge=row[0]
                    break
      
            #sides are 1 nautical mile long long, so 1852 meters
            lngth = (longest_edge - (1852*2))/2
            length_nm = lngth*0.00062137
            return length_nm
            
        except StandardError, e:
            arcpy.AddMessage("problem getting length: {}".format(e))
            return 0.0
        