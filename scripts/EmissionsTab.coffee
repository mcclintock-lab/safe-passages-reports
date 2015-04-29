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
    existingLength = 122.75
    length = new_length


    new_co2_emissions = Math.round(@recordSet('Emissions', 'NewCO2').data.value,1)
    orig_co2_emissions = Math.round(@recordSet('Emissions', 'OrigCO2').data.value,1)
    co2EmissionsIncreased = orig_co2_emissions - new_co2_emissions < 0
    co2EmissionsChangeClass = if co2EmissionsIncreased then 'positive' else 'negative'
    co2EmissionsPercentChange =  Math.abs(((orig_co2_emissions - new_co2_emissions) / new_co2_emissions) * 100)
    if Math.abs(orig_co2_emissions - new_co2_emissions) < 0.01
      co2EmissionsChangeClass = 'nochange'
    significantCO2EmissionsChange = Math.abs(orig_co2_emissions - new_co2_emissions) > 0.1

    new_nox_emissions = Math.round(@recordSet('Emissions', 'NewNOX').data.value,1)
    orig_nox_emissions = Math.round(@recordSet('Emissions', 'OrigNOX').data.value,1)
    noxEmissionsIncreased = orig_nox_emissions - new_nox_emissions < 0
    noxEmissionsChangeClass = if noxEmissionsIncreased then 'positive' else 'negative'
    noxEmissionsPercentChange =  Math.abs(((orig_nox_emissions - new_nox_emissions) / new_nox_emissions) * 100)
    if Math.abs(orig_nox_emissions - new_nox_emissions) < 0.01
      noxEmissionsChangeClass = 'nochange'
    significantNOXEmissionsChange = Math.abs(orig_nox_emissions - new_nox_emissions) > 0.1

    new_pm_emissions = Math.round(@recordSet('Emissions', 'NewPM').data.value,1)
    orig_pm_emissions = Math.round(@recordSet('Emissions', 'OrigPM').data.value,1)
    pmEmissionsIncreased = orig_pm_emissions - new_pm_emissions < 0
    pmEmissionsChangeClass = if pmEmissionsIncreased then 'positive' else 'negative'
    pmEmissionsPercentChange =  Math.abs(((orig_pm_emissions - new_pm_emissions) / new_pm_emissions) * 100)

    if Math.abs(orig_pm_emissions - new_pm_emissions) < 0.01
      pmEmissionsChangeClass = 'nochange'
    significantPMEmissionsChange = Math.abs(orig_pm_emissions - new_pm_emissions) > 0.1

    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      new_length: new_length

      significantCO2EmissionsChange: significantCO2EmissionsChange
      new_co2_emissions: Math.round(new_co2_emissions)
      orig_co2_emissions: Math.round(orig_co2_emissions)
      co2EmissionsIncreased: co2EmissionsIncreased
      co2EmissionsChangeClass: co2EmissionsChangeClass
      co2EmissionsPercentChange: Math.round(co2EmissionsPercentChange)

      significantNOXEmissionsChange: significantNOXEmissionsChange
      new_nox_emissions: Math.round(new_nox_emissions)
      orig_nox_emissions: Math.round(orig_nox_emissions)
      noxEmissionsIncreased: noxEmissionsIncreased
      noxEmissionsChangeClass: noxEmissionsChangeClass
      noxEmissionsPercentChange: Math.round(noxEmissionsPercentChange)

      significantPMEmissionsChange: significantPMEmissionsChange
      new_pm_emissions: Math.round(new_pm_emissions)
      orig_pm_emissions: Math.round(orig_pm_emissions)
      pmEmissionsIncreased: pmEmissionsIncreased
      pmEmissionsChangeClass: pmEmissionsChangeClass
      pmEmissionsPercentChange: Math.round(pmEmissionsPercentChange)

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