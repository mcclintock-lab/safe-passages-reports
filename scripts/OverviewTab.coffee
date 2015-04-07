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

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['ShippingLaneReport']

  render: () ->
    window.results = @results
    existingLength = 158
    length = Math.round(@recordSet('ShippingLaneReport', 'NewLength').data.value,1)
    console.log("new length: ", length)
    #length = @model.get('geometry').features[0].attributes.Shape_Length / 5048
    percentChange = Math.abs(((existingLength - length) / existingLength) * 100)
    lengthIncreased = existingLength - length < 0
    lengthChange = Math.round(Math.abs(existingLength-length))
    lengthChangeClass = if lengthIncreased then 'positive' else 'negative'
    console.log("----dist ", (existingLength - length))
    if Math.abs(existingLength - length) < 0.01
      lengthChangeClass = 'nochange'

    rigs = @recordSet('ShippingLaneReport', 'RigsNear')
    rigIntersections = 0
    for rig in rigs.toArray()
      if rig.NEAR_DIST < 500
        rigIntersections = rigIntersections + 1
    overlapsRig = rigIntersections > 0

    context =
      intersectsRig: overlapsRig
      length: length 
      existingLength: Math.round(existingLength)
      lengthChangeClass: lengthChangeClass
      lengthIncreased:lengthIncreased
      lengthChange:lengthChange
      percentChange: Math.round(percentChange)

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

module.exports = OverviewTab