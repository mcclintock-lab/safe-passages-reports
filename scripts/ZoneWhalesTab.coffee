ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val
sightingsTemplate = require './sightingsTemplate.coffee'

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
    
    for sw in sensitiveWhales
      sw.BLUE_TOT = 2809
      sw.BLUE_SQM = Math.round(sw.BLUE_SQM)
      sw.GRAY_TOT = 50667
      sw.GRAY_SQM = Math.round(sw.GRAY_SQM)
      sw.HUMP_TOT = 1267
      sw.HUMP_SQM = Math.round(sw.HUMP_SQM)

    sightings = {}
    sightings_tot = {}
    sightings_perc = {}

    for feature in whaleSightings
      species = feature.Species
      unless species in _.keys(sightings)
        sightings[feature.Species] = 0
      sightings[species] = sightings[species] + parseInt(feature.FREQUENCY)
      sightings_tot[species] = feature.count_tot
      sightings_perc[species] = feature.count_perc

    sightingsData = _.map sightingsTemplate, (s) -> _.clone(s)
    countData = []
    for record in sightingsData
      record.count_tot = sightings_tot[record.id]
      record.count_perc = sightings_perc[record.id]
      record.count = sightings[record.id] if sightings[record.id]
      record.diff = record.count - record.unchangedCount
      record.percentChange =  Math.round((Math.abs(record.diff)/record.unchangedCount) * 100)
      if record.percentChange is Infinity then record.percentChange = '>100';
      record.changeClass = if record.diff > 0 then 'positive' else 'negative'
      if _.isNaN(record.percentChange)
        record.percentChange = 0
        record.changeClass = 'nochange'
      if record.count != 0
        countData.push(record)

    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      whaleSightings: countData
      sensitiveWhales: sensitiveWhales

    @$el.html @template.render context, @partials
    @enableLayerTogglers(@$el)

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