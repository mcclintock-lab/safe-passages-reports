import arcpy

NEW_LENGTH = "NEWLENGTH"
class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the toolbox name is the name of the .pyt file)"""
        self.label = "SLBuffer"
        self.alias = ""

        # List of tool classes associated with this toolbox
        self.tools = [Preprocess] 

class Preprocess(object):

    
    def __init__(self):
        """Define the tool (tool name is the name of the class)"""
        self.label = "Preprocess"
        self.description = "Preprocessing script for Safe Passages"
        self.canRunInBackground = True

    def getParameterInfo(self):
      param0 = arcpy.Parameter(
        displayName="AllInputs",
        name="AllInputs",
        datatype="Feature Class",
        parameterType="Required",
        direction="Input" )

      param1 = arcpy.Parameter(
        displayName="AllOutputs",
        name="AllOutputs",
        datatype="Feature Class",
        parameterType="Derived",
        direction="Output" )

      param2 = arcpy.Parameter(
        displayName="ResultCode",
        name="ResultCode",
        datatype="Long",
        parameterType="Derived",
        direction="Output" )

      param3 = arcpy.Parameter(
        displayName="ResultMsg",
        name="ResultMsg",
        datatype="String",
        parameterType="Derived",
        direction="Output" )


      params = [param0, param1, param2, param3]
      return params

    def updateParameters(self, parameters):
      param1 = parameters[1]
      param1.schema.featureTypeRule = "AsSpecified"
      param1.schema.featureType = "Simple"
      param1.schema.geometryTypeRule = "AsSpecified"
      param1.schema.geometryType = "Polygon" # Or Point, Multipoint, Polyline
      param1.schema.fieldsRule = "None" # Mean we have to explicity specify which fields to include
      lane = arcpy.Field()
      lane.name="LANE" 
      lane.type="esriFieldTypeInteger"
      side = arcpy.Field()
      side.name="SIDE" 
      side.type="esriFieldTypeString"
      shape_length = arcpy.Field()
      shape_length.name="Shape_Length"
      shape_length.type="esriFieldTypeDouble"
      shape_area = arcpy.Field()
      shape_area.name="Shape_Area" 
      shape_area.type="esriFieldTypeDouble"
      param1.schema.additionalFields = [lane, side, shape_length, shape_area]
      return


    def isLicensed(self):
        return True

    def execute(self, parameters, messages):
      in_feats = parameters[0].valueAsText
      in_number_of_lanes = 0
      in_separation = 0
      separation_layer = "in_memory\\separation"
      buff_dist = u'BUFF_DIST'
      final_layer = "in_memory\\final"
      returnCode = "0"
      returnMsg = ""
      

      # Extract the input params
      try:
        desc = arcpy.Describe(in_feats)
      except StandardError, e:
        arcpy.AddError(e)

      arcpy.AddMessage("Shapetype: " + desc.shapeType)
      field_list = desc.fields
      idx = 0
      nlanes_idx = 0
      separation_idx = 0
      for field in field_list:
        arcpy.AddMessage("field: " + field.name)
        if field.name.upper() == "NLANES":
          nlanes_idx = idx
        if field.name.upper() == "SEPARATION":
          separation_idx = idx
        idx += 1
      input_length = 0
      with arcpy.da.SearchCursor(in_feats, ["SHAPE@LENGTH"]) as cursor:
        for row in cursor:
          input_length = row[0]
      with arcpy.da.UpdateCursor(in_feats,["*"]) as cursor:
        for row in cursor:
          in_number_of_lanes = row[nlanes_idx]
          in_separation = row[separation_idx]
          arcpy.AddMessage("NLanes: " + str(in_number_of_lanes))
          arcpy.AddMessage("Separation: " + str(in_separation))

      arcpy.AddMessage("in_feats.shapeType: " + desc.shapeType)
      if desc.shapeType != "Polyline":
        raise StandardError("Invalid input: shape type " + desc.shapeType)
      if in_separation < 0:
        raise StandardError("Invalid input: separation " + str(in_separation * 2))
      if in_number_of_lanes < 1:
        raise StandardError("Invalid input: number of lanes " + str(in_number_of_lanes))

      try: 
        arcpy.env.overwriteOutput = True
        arcpy.AddMessage("Executing buffer")

        # get the input fields to be included in the output
        field_list = arcpy.ListFields(in_feats)
        keep_list = []
        for field in field_list:
            if field.type != "OID" and field.type != "Geometry" and not "SHAPE" in field.name.upper():
                keep_list.append(field.name)
        # add side and lane
        keep_list.append("SIDE")
        keep_list.append("LANE")

        # Set the cluster tolerance to prevent slivers
        tol = "0.001 NauticalMiles"

        if in_separation > 0:
          # create the separation buffer
          realsep = in_separation/2
          dist = str(realsep)+" NauticalMiles"
          sep = separation_layer
          res = arcpy.Buffer_analysis(in_feats,sep,dist,"","FLAT")
          arcpy.AddMessage(arcpy.GetMessages())


        # create the shipping lanes buffers
        i = in_number_of_lanes
        while (i > 0):
          j = i + realsep 
          dist = str(j) + " NauticalMiles"
          # Create left and right buffers then union them.
          temp = "in_memory\\" + "left" + str(i)
          arcpy.AddMessage("Temp is " + str(temp)+ "dist: " + str(dist))
          arcpy.Buffer_analysis(in_feats,temp,dist,"LEFT","FLAT")
          arcpy.AddMessage(arcpy.GetMessages())
          arcpy.DeleteField_management(temp,buff_dist)
          arcpy.AddField_management(temp,"SIDE","TEXT","","10")
          arcpy.AddField_management(temp,"LANE","LONG")
          with arcpy.da.UpdateCursor(temp,["SIDE","LANE"]) as cursor:
              for row in cursor:
                  row[0] = "LEFT"
                  row[1] = i
                  arcpy.AddMessage("left: {}".format(row))
                  cursor.updateRow(row)
          feat_list = [ temp ]
          temp = "in_memory\\" + "right" + str(i)
          arcpy.Buffer_analysis(in_feats,temp,dist,"RIGHT","FLAT")
          arcpy.AddMessage(arcpy.GetMessages())
          arcpy.DeleteField_management(temp,buff_dist)
          arcpy.AddField_management(temp,"SIDE","TEXT","","10")
          arcpy.AddField_management(temp,"LANE","LONG")
          with arcpy.da.UpdateCursor(temp,["SIDE","LANE"]) as cursor:
              for row in cursor:
                  row[0] = "RIGHT"
                  row[1] = i
                  arcpy.AddMessage("right: {}".format(row))
                  cursor.updateRow(row)

          feat_list.append( temp )
          temp = "in_memory\\" + "union" + str(i)
          arcpy.Union_analysis(feat_list,temp,"NO_FID",tol)
          arcpy.AddMessage(arcpy.GetMessages())
          # roll up the attributes
          temp = self.rollUpAttributes(temp,keep_list)

          # use Identity_analysis to intersect outermost polygon successively with the inner polygons.
          j = i + 1
          next = "in_memory\\" + "identity" + str(i)
          if i == in_number_of_lanes - 1:
            prev = "in_memory\\" + "union" + str(j)
            arcpy.Identity_analysis(prev,temp,next,"NO_FID",tol)
            arcpy.GetMessages()
            next = self.rollUpAttributes(next,keep_list)
          if i < in_number_of_lanes - 1:
            prev = "in_memory\\" + "identity" + str(j)
            arcpy.Identity_analysis(prev,temp,next,"NO_FID",tol)
            arcpy.GetMessages()
            next = self.rollUpAttributes(next,keep_list)
          if in_number_of_lanes == 1:
            next = temp
          i = i - 1

        if in_separation > 0:
          # delete the original separation buffer using Erase
          buffered_outputs = final_layer
          res = arcpy.Erase_analysis(next,sep,buffered_outputs, tol)
          arcpy.AddMessage(arcpy.GetMessages())
        else:
          buffered_outputs = next

        arcpy.AddField_management(buffered_outputs,NEW_LENGTH,"TEXT","","20")
        res = arcpy.GetCount_management(buffered_outputs)

        isects = r"in_memory\\isects"
        isect_feature1 = "channel_data\\10m_land.shp"
        isect_features = [buffered_outputs, isect_feature1]

        arcpy.Intersect_analysis(isect_features,  isects, "ALL", "", "INPUT")
        arcpy.AddMessage(arcpy.GetMessages())

        isect_count = 0
        for row in arcpy.da.SearchCursor(isects, ["*"]):
      	    arcpy.AddMessage(str(row))
      	    isect_count += 1

        arcpy.AddMessage("Features in intersection: " + str(isect_count))
        if isect_count > 0:
          returnCode = "-1"
          returnMsg = "The shipping lanes are partially on land."

        with arcpy.da.UpdateCursor(buffered_outputs, [NEW_LENGTH]) as cursor:
          for row in cursor:
            row[0] = round(input_length,2)
            cursor.updateRow(row)
        arcpy.SetParameter(1, buffered_outputs)
        arcpy.SetParameterAsText(2, returnCode)
        arcpy.SetParameterAsText(3, returnMsg)

      except StandardError, e:
        arcpy.AddError(e)
      return



    def rollUpAttributes(self, temp, keep_list):
      try:
        # find the first input field
        idx_side_field = 0
        side_field_found = False
        field_list = arcpy.ListFields(temp)
        for field in field_list:
          if field.name == "SIDE":
            side_field_found = True
            break
          idx_side_field += 1
        keep_list_count = len(keep_list)
        arcpy.AddMessage("????????   keep list count is {}".format(keep_list_count))
        # SIDE will always be second to the end (LANE is last)
        idx_first_field = idx_side_field - keep_list_count + 2
        if not side_field_found:
          return temp

        arcpy.AddMessage("row {}".format(side_field_found))

        with arcpy.da.UpdateCursor(temp,["*"]) as cursor:
          for row in cursor:
            cntr = idx_side_field + 1 + keep_list_count
            arcpy.AddMessage("----- {}".format(row[idx_side_field]))
            arcpy.AddMessage("====== {}".format(row[cntr]))
            
            if cntr > len(row) and len(str(row[cntr])) > 0:
              if str(row[idx_side_field]) == "" or int(row[idx_side_field + 1 + keep_list_count]) > 0:
                i = idx_first_field
                while (i < idx_first_field + keep_list_count):
                  row[i] = row[i + keep_list_count]
                  i += 1
                arcpy.AddMessage("row: {}".format(row))
                cursor.updateRow(row)

        delete_list = ""
        for field in field_list:
          if field.type != "OID" and field.type != "Geometry" and not "SHAPE" in field.name and not field.name in keep_list:
            if len(delete_list) == 0:
              delete_list = field.name
            else:
              delete_list += ";" + field.name
        if delete_list != "":
          arcpy.DeleteField_management(temp,delete_list)
          arcpy.AddMessage(arcpy.GetMessages())

      except StandardError, e:
        arcpy.AddError(e)

      return temp


