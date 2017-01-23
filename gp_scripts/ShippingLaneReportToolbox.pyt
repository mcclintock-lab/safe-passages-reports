import arcpy
import sp

NEW_LENGTH = "NEWLENGTH"
class Toolbox(object):
    
    def __init__(self):
        self.label = "ShippingLaneReportToolbox"
        self.alias = "ShippingLaneReportToolbox"

        # List of tool classes associated with this toolbox
        self.tools = [ShippingLaneReport]

class ShippingLaneReport(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "ShippingLaneReport"
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

      rigs_near= arcpy.Parameter(
        displayName="RigsNear",
        name="RigsNear",
        datatype="Feature Class",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      whales= arcpy.Parameter(
        displayName="WhaleCount",
        name="WhaleCount",
        datatype="GPRecordSet",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      habitats= arcpy.Parameter(
        displayName="Habitats",
        name="Habitats",
        datatype="Feature Class",
        parameterType="Derived",
        multiValue=True,
        direction="Output" )

      new_length= arcpy.Parameter(
        displayName="NewLength",
        name="NewLength",
        datatype="GPDouble",
        parameterType="Derived",
        direction="Output" )

      convergence_warning = arcpy.Parameter(
        displayName="ConWarning",
        name="ConWarning",
        datatype="GPString",
        parameterType="Derived",
        direction="Output" )

      params = [inputs, result_code, result_msg, rigs_near, whales, habitats, new_length, convergence_warning]
      return params
    
    def updateParameters(self, parameters):
        return

    def isLicensed(self):
        return True

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):

        try:
            all_inputs = parameters[0].values
            #in_lanes = all_inputs[0]
            cateal_sr = arcpy.SpatialReference(sp.CA_TEAL_ALBERS_SR)

            in_lanes = sp.reproject(all_inputs[0], cateal_sr, 0, "zonesize"+str(0))
            in_whales = r"whales_ta.shp"
            in_isobath = r"channel_data\200_m_isobath_buffered_ta.shp"
            in_oilrigs = r"channel_data\oil_platforms_ta.shp"
            in_searchdist = "5 NauticalMiles"

            # validate input parameters
            arcpy.env.overwriteOutput = True
            arcpy.AddMessage("Executing overlay")
            tol = "0.001 NauticalMiles"

            # Make an in_memory copy of the input oil rigs so the near attributes can be added
            rigcopy = "in_memory\\" + "rigcopy"
            arcpy.CopyFeatures_management(in_oilrigs,rigcopy)
            # Near Oil Rigs and shipping lanes
            arcpy.Near_analysis(rigcopy,in_lanes,in_searchdist)
            arcpy.AddMessage(arcpy.GetMessages())

            # create featureset with matching rows (reselect)
            rigsnear = "in_memory\\" + "rigsnear"
            near_fid = u'"NEAR_FID" > -1'
            arcpy.Select_analysis(rigcopy,rigsnear,near_fid)
            arcpy.AddMessage(arcpy.GetMessages())

            # Intersect whales and shipping lanes
            sightings = "in_memory\\" + "sightings"
            whalecount = "in_memory\\" + "whalecount"
            arcpy.Intersect_analysis([in_lanes,in_whales],sightings,"ALL",tol)
            arcpy.AddMessage(arcpy.GetMessages())

            # Count the whales
            sightings_data = u'SIDE;LANE;Species'
            arcpy.Frequency_analysis(sightings,whalecount,sightings_data)
            arcpy.AddMessage(arcpy.GetMessages())

            # Intersect 200m isobath and shipping lanes
            habitat = "in_memory\\" + "habitat"
            arcpy.Intersect_analysis([in_lanes,in_isobath],habitat,"ALL",tol)
            arcpy.AddMessage(arcpy.GetMessages())

            returnMsg = "number of whales: {}".format(arcpy.GetCount_management(sightings).getOutput(0))
            returnCode = "0"

            new_length = self.get_new_length(in_lanes)
           
            ws = arcpy.RecordSet()
            ws.load(whalecount)

            returnMsg = arcpy.Describe(ws)

            #[inputs, result_code, result_msg, rigs_near, whales, habitats
            arcpy.SetParameter(1, returnCode)
            arcpy.SetParameter(2, returnMsg)
            # set output features
            featSet = arcpy.FeatureSet()
            featSet.load(rigsnear)

            arcpy.SetParameter(3, featSet)
            arcpy.SetParameter(4, ws)
            
            featSet = arcpy.FeatureSet()
            featSet.load(habitat)
            #arcpy.AddMessage("results: {}".format(arcpy.Describe(habitat).pjson))
            arcpy.SetParameter(5, featSet)

            arcpy.SetParameter(6, new_length)

            con_warning = self.get_convergence_zone_warning(in_lanes)
            arcpy.AddMessage("warning: {}".format(con_warning))
            arcpy.SetParameter(7, con_warning)

        except StandardError, e:
            arcpy.AddError(e)

    #see if the shipping lanes 
    def get_convergence_zone_warning(self, in_lanes):
        port_circle = r"port_point_circle.shp"
        con_zone_circle = r"convergence_zone_circle.shp"
        within_port = False
        within_cz = False

        port_intsct = r"in_memory\port_circle_int"
        portfeats = [port_circle, in_lanes]
        arcpy.Intersect_analysis(portfeats, port_intsct, "ALL")
        if int(arcpy.GetCount_management(port_intsct).getOutput(0) or 0) > 0:
            within_port = True

        cz_intsct = r"in_memory\cz_circle_int"
        czfeats = [con_zone_circle, in_lanes]
        arcpy.Intersect_analysis(czfeats, cz_intsct, "ALL")
        arcpy.AddMessage("out: {}".format(arcpy.GetCount_management(cz_intsct).getOutput(0)))
        if int(arcpy.GetCount_management(cz_intsct).getOutput(0) or 0) > 0:
            within_cz = True
        arcpy.AddMessage("within port: {}; within cz: {}".format(within_port, within_cz))
        if within_port and within_cz:
            return ""
        elif not within_cz and not within_port:
            return "The shipping lane does not have one end point within 10 miles of the Port of LA/LB and the other end point within 25 miles of the Pt. Conception convergence zone."
        elif within_cz and not within_port:
            return "The shipping lane does not have one end point within 10 miles of the Port of LA/LB"
        else:
            return "The shipping lane does not have one end point within 25 miles of the Pt. Conception convergence zone."

    def get_separation(self, in_feature):
        try:
            with arcpy.da.SearchCursor(in_feature, ["SIDE", "SEPARATION"]) as cursor:
                for row in cursor:
                    if len(str(row[0])) != 0:
                        return 1852*(row[1])
        except StandardError:
            return 1852

    def get_co2_per_nautical_mile(self):
        nautical_dict = {10:0.12, 12:0.17, 14:0.23, 16:0.30, 18:0.38};
        
    def get_new_length(self, in_feature):
        try:
            '''
            line_feat = r"in_memory\length"
            arcpy.FeatureToLine_management([in_feature], line_feat,
                               "0.001 Meters", "ATTRIBUTES")
            short_edge = self.get_separation(in_feature)
            '''
            short_edge = 1852
            longest_edge = 0
            with arcpy.da.SearchCursor(in_feature, ["SHAPE@LENGTH"]) as cursor:
                for row in cursor:
                    length = row[0]
                    arcpy.AddMessage("length: {}".format(length))
                    longest_edge+=float(row[0])
                    break

            lngth = (longest_edge - (short_edge*2))/2
            return lngth*0.00062137
            
        except StandardError, e:
            arcpy.AddMessage("problem getting length: {}".format(e))
            return 0.0