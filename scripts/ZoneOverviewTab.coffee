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

class ZoneOverviewTab extends ReportTab
  name: 'Overview'
  className: 'zoneOverview'
  template: templates.zoneOverview
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['ZoneSize']

  render: () ->
    window.results = @results
    attributes = @model.getAttributes()
    console.log("attributes: ", attributes.attributesTable)
    anyAttributes = attributes.length? > 0
    zonesize = @recordSet('ZoneSize', 'Size').float('SIZE_SQMI')

    context =
      sketchClass: @sketchClass.forTemplate()
      zonesize: zonesize 
      attributes:attributes
      anyAttributes: anyAttributes

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

module.exports = ZoneOverviewTab