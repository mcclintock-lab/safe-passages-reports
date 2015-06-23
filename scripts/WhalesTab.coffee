ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val
sightingsTemplate = require './newSightingsTemplate.coffee'


ids = require './ids.coffee'

for key, value of ids
  window[key] = value

addCommas = (nStr) ->
  nStr += ''
  x = nStr.split('.')
  x1 = x[0]
  x2 = if x.length > 1 then '.' + x[1] else ''
  rgx = /(\d+)(\d{3})/
  while (rgx.test(x1))
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  return x1 + x2

class WhalesTab extends ReportTab
  name: 'Whales'
  className: 'whales'
  template: templates.whales
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['SensitiveWhaleOverlap', 'WhaleOverlapTool']

  render: () ->

    window.results = @results
    #isobath = @recordSet('ShippingLaneReport', 'Habitats')
    
    console.log("sketch class name: ", @sketchClass.id)
    sensitiveWhales = @recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray()
    @loadSensitiveWhaleData sensitiveWhales
    whaleSightings = @recordSet('WhaleOverlapTool', 'WhaleCount').toArray()


    whales_in_mgmt_areas = _.filter whaleSightings, (row) -> row.SC_ID == MGMT_AREA_ID
    console.log('wmgt:', whales_in_mgmt_areas)       

    hasManagementAreas = whales_in_mgmt_areas?.length > 0
    mgmt_area_whales = _.map sightingsTemplate, (s) -> _.clone(s)
    @loadSightingsData mgmt_area_whales, whales_in_mgmt_areas

    whales_in_shipping_lanes = _.filter whaleSightings, (row) -> (row.SC_ID == SHIPPING_LANE_ID)
    hasShippingLanes = whales_in_shipping_lanes?.length > 0
    shipping_lane_whales = _.map sightingsTemplate, (s) -> _.clone(s)
    @loadSightingsData shipping_lane_whales, whales_in_shipping_lanes

    whales_in_other_areas = _.filter whaleSightings, (row) -> (row.SC_ID != SHIPPING_LANE_ID && row.SC_ID != MGMT_AREA_ID)

    hasOtherWhales= whales_in_other_areas?.length > 0
    other_whales = _.map sightingsTemplate, (s) -> _.clone(s)
    @loadSightingsData other_whales, whales_in_other_areas


    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()

      mgmt_area_whales: mgmt_area_whales
      shipping_lane_whales: shipping_lane_whales
      other_whales: other_whales

      hasManagementAreas: hasManagementAreas
      hasShippingLanes: hasShippingLanes
      hasOtherWhales: hasOtherWhales

      sensitiveWhales: sensitiveWhales

    @$el.html @template.render context, @partials
    @enableLayerTogglers(@$el)


  get_whale_species: (common_name) ->
    mapping = {'Blue':'Balaenoptera musculus', 'Humpback':'Megaptera novaeangliae','Gray':'Eschrichtius robustus','Fin':'Balaenoptera physalus','Minke':'Balaenoptera acutorostrata','Pilot Whale':'Globicephala macrorhynchus'}
    return mapping[common_name]
  
  get_whale_name: (common_name) ->
    mapping = {'Blue':'Blue Whale', 'Humpback':'Humpback Whale','Gray':'Gray Whale','Fin':'Fin Whale','Minke':'Minke Whale','Pilot Whale':'Pilot Whale'}
    return mapping[common_name]

  get_found_whale: (id, found_data) ->
    for fd in found_data
      if fd.Species == id
        return fd
    return null

  is_na: (data) ->
    for record in data
      if record.FREQUENCY == "N/A"
        return true
    return false

  loadSightingsData: (full_data, found_data) ->
    if @is_na(found_data)
      for record in full_data
        record.is_na = "N/A"
    else
      for record in full_data
        fd = @get_found_whale(record.id, found_data)
        if fd != null
          record.count_perc = fd.count_perc
          record.count_tot = fd.count_tot

          record.count = fd.FREQUENCY

  loadSensitiveWhaleData: (data) ->
    for sw in data
      sc_id = sw.SC_ID
      scd = @app.sketchClasses.get(sc_id)
      sw.SC_NAME = scd.attributes.name
      sw.BLUE_TOT = 2809
      sw.BLUE_SQM = Math.round(sw.BLUE_SQM)+" sq. mi."
      sw.GRAY_TOT = 50667
      sw.GRAY_SQM = Math.round(sw.GRAY_SQM)+" sq. mi."
      sw.HUMP_TOT = 1267
      sw.HUMP_SQM = Math.round(sw.HUMP_SQM)+" sq. mi."
    
    return data

  _handleReportLayerClick: (e) ->
    e.preventDefault()
    url = $(e.target).attr('href')
    node = window.app.projecthomepage.dataSidebar.layerTree.getNodeByUrl url
    node?.makeVisible()
    node?.makeAllVisibleBelow()
    node?.updateMap()
    false

  onMoreResultsClick: (e) =>
    e?.preventDefault?()
    $(e.target).closest('.reportSection').removeClass 'collapsed'

module.exports = WhalesTab