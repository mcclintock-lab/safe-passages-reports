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

class EmissionsTab extends ReportTab
  name: 'Emissions'
  className: 'emissions'
  template: templates.emissions
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: ['ShippingLaneReport', 'Emissions']

  render: () ->
    window.results = @results

    new_length = Math.round(@recordSet('ShippingLaneReport', 'NewLength').data.value,1)
    new_emissions = Math.round(@recordSet('Emissions', 'Emissions').data.value,1)
    original_emissions = Math.round(@recordSet('Emissions', 'OriginalEmissions').data.value,1)


    existingLength = 122.75
    length = new_length
    #length = @model.get('geometry').features[0].attributes.Shape_Length / 5048
    percentChange = Math.abs(((existingLength - length) / existingLength) * 100)
    lengthIncreased = existingLength - length < 0
    lengthChangeClass = if lengthIncreased then 'positive' else 'negative'
    if Math.abs(existingLength - length) < 0.01
      lengthChangeClass = 'nochange'

    emissionsIncreased = original_emissions - new_emissions < 0
    emissionsChangeClass = if emissionsIncreased then 'positive' else 'negative'
    emissionsPercentChange =  Math.abs(((original_emissions - new_emissions) / existingLength) * 100)
    if Math.abs(original_emissions - new_emissions) < 0.01
      emissionsChangeClass = 'nochange'


    # from http://www.bren.ucsb.edu/research/documents/whales_report.pdf
    # increase in voyage cost per nm
    vc = 3535
    # increase in operating costs
    oc = 2315
    # page 40 lists lane increase as 13.8nm
    costIncreasePerNMPerTransit = (vc + oc) / 13.8
    # I'm working backwords here, so all this shit is terribly inaccurate
    fuelCost = 625 # per ton
    # assumes voyage cost is all fuel (wrong - ignoring lubricant, dock fees, etc)
    tonsFuelPerNM = (vc / 13.8) / 625
    # 5,725 transits - page 87
    costIncreasePerNM = costIncreasePerNMPerTransit * 5725
    costChange = Math.abs(costIncreasePerNM * (length - existingLength))
    tonsFuel = tonsFuelPerNM * length
    context =
      significantDistanceChange: Math.abs(existingLength - length) > 0.1
      significantEmissionsChange: Math.abs(original_emissions - new_emissions) > 0.1

      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      length: Math.round(length * 100) / 100
      lengthChangeClass: lengthChangeClass
      lengthPercentChange: Math.round(percentChange * 10) / 10
      costChange: addCommas(Math.round(costChange * 100) / 100)
      tonsFuelPerTransit: Math.round(tonsFuel)
      tonsFuelChange: Math.round((tonsFuel - (tonsFuelPerNM * existingLength)) * 5725)
      lengthChange: Math.round((length - existingLength) * 100) / 100

      new_length: new_length
      new_emissions: Math.round(new_emissions)
      orig_emissions: Math.round(original_emissions)
      emissionsIncreased: emissionsIncreased
      emissionsChangeClass: emissionsChangeClass
      emissionsPercentChange: Math.round(emissionsPercentChange)

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

module.exports = EmissionsTab