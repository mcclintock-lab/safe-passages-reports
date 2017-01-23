import arcpy

import sp
DEBUG=True
class Toolbox(object):
    
    def __init__(self):
        self.label = "CalculateBIANumbersToolbox"
        self.alias = "CalculateBIANumbersToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [CalculateBIANumbers]

class CalculateBIANumbers(object):
    
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "CalculateBIANumbers"
        self.description = ("Calculate the habitat types within the existing layers")
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
        
        bia_layer = r"cetmap_sp.shp"

        if DEBUG:
            reload(sp)
        cet_types = {}
        with arcpy.da.SearchCursor(bia_layer, ['cmn_name', "SHAPE@AREA"]) as cursor:
            for row in cursor:
                cet = str(row[0]) 
                if cet is not None and len(cet.strip()) > 0:
                    area = float(row[1])                
                    curr_size = cet_types.get(cet)                   
                    if curr_size is None:
                        curr_size = 0
                    cet_types[cet] = area+curr_size
                    
        arcpy.AddMessage("{0}".format(cet_types))


        return

            

