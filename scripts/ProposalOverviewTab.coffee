ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val
#sightingsTemplate = require './sightingsTemplate.coffee'

addCommas = (nStr) ->
  nStr += ''
  x = nStr.split('.')
  x1 = x[0]
  x2 = if x.length > 1 then '.' + x[1] else ''
  rgx = /(\d+)(\d{3})/
  while (rgx.test(x1))
    x1 = x1.replace(rgx, '$1' + ',' + '$2')
  return x1 + x2

class ProposalOverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.proposalOverview
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['ShippingLaneLengthForProposal','ZoneSize' ]

  render: () ->
    window.results = @results
    isCollection = @model.isCollection()

    lengths = @recordSet('ShippingLaneLengthForProposal', 'Lengths').toArray()
    zonesizes = @recordSet('ZoneSize', 'Size').toArray()
    for l in lengths
      l.NEW_LENGTH = parseFloat(l.NEW_LENGTH).toFixed(1)

    context =
      lengths: lengths
      zones: zonesizes

    @$el.html @template.render context, @partials

    @enableLayerTogglers(@$el)

module.exports = ProposalOverviewTab