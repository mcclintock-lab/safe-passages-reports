ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val
sightingsTemplate = require './sightingsTemplate.coffee'
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

class ZoneWhalesTab extends ReportTab
  name: 'Whales'
  className: 'whales'
  template: templates.zoneWhales
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['WhaleOverlapTool', 'SensitiveWhaleOverlap']

  render: () ->
    window.results = @results
    whaleSightings = @recordSet('WhaleOverlapTool', 'WhaleCount').toArray()
    sensitiveWhales = @recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray()

    mgmt_area_whales = _.filter whaleSightings, (row) -> row.SC_ID == MGMT_AREA_ID 

    shipping_lane_whales = _.filter whaleSightings, (row) -> row.SC_ID == SHIPPING_LANE_ID 
    console.log("mgmt_area_whales", mgmt_area_whales)
    
    mgmt_sightings = {}
    for feature in mgmt_area_whales
      species = feature.Species
      unless species in _.keys(mgmt_sightings)
        mgmt_sightings[feature.Species] = 0
      mgmt_sightings[species] = mgmt_sightings[species] + parseInt(feature.FREQUENCY)
    
    shipping_sightings = {}
    for feature in shipping_lane_whales
      species = feature.Species
      unless species in _.keys(mgmt_sightings)
        shipping_sightings[feature.Species] = 0
      shipping_sightings[species] = shipping_sightings[species] + parseInt(feature.FREQUENCY)
      
    mgmt_area_whales = _.map sightingsTemplate, (s) -> _.clone(s)
    @loadSightingsData mgmt_sightings, mgmt_sightings

    shipping_lane_whales = _.map sightingsTemplate, (s) -> _.clone(s)
    @loadSightingsData shipping_sightings, shipping_sightings


    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      mgmt_area_whales: mgmt_area_whales
      shipping_lane_whales: shipping_lane_whales

      sensitiveWhales: sensitiveWhales

    @$el.html @template.render context, @partials
    @enableLayerTogglers(@$el)

  loadSightingsData: (data, sightings) ->
    for record in data
      if record.FEQUENCY == "N/A"
        record.is_na = true
      else
        record.is_na = false
        record.count = sightings[record.id] if sightings[record.id]
        record.count_perc = Number((record.count/record.count_tot)*100).toFixed(1)
        record.diff = record.count - record.unchangedCount
        record.percentChange =  Math.round((Math.abs(record.diff)/record.unchangedCount) * 100)
        if record.percentChange is Infinity then record.percentChange = '>100';
        record.changeClass = if record.diff > 0 then 'positive' else 'negative'
        if _.isNaN(record.percentChange)
          record.percentChange = 0
          record.changeClass = 'nochange'


  loadSensitiveWhaleData: (data) ->
    man_area_id = "55230839b43a3ad42844d410"
    shipping_lane = "54d2a8affa94e697759cbc79"

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




  # Shouldn't we give some feedback to the user if the layer isn't present in the layer tree?
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

module.exports = ZoneWhalesTab