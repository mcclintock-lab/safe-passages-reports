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

class ProposalEmissionsTab extends ReportTab
  name: 'Emissions'
  className: 'emissions'
  template: templates.proposalEmissions
  events:
    "click a[rel=toggle-layer]" : '_handleReportLayerClick'
    "click a.moreResults":        'onMoreResultsClick'
  dependencies: [ 'EmissionsReduction']

  render: () ->
    window.results = @results
    emissions = @recordSet('EmissionsReduction', 'Emissions').toArray()    
    reductions = @parseReductions emissions
    emissionsReductions = []
    for key in Object.keys(reductions)
      console.log("red: ", reductions[key])
      emissionsReductions.push(reductions[key])
    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      emissionsReductions: emissionsReductions

    @$el.html @template.render context, @partials

    @enableLayerTogglers(@$el)

  parseReductions: (emissions) =>
    reductions = {}
    console.log("emissions:", emissions)
    for er in emissions
      name = er.NAME
      type = er.NEW_OR_OLD
      if reductions[name]
        currRed = reductions[name]
      else
        currRed = {"NAME":name}
        

      if type == "ORIG"
        console.log("its orig", er.CO2)
        currRed.ORIG_CO2 = er.CO2
        currRed.ORIG_NOX = er.NOX
        currRed.ORIG_SOX = er.SOX
        currRed.ORIG_PM10 = er.PM10
      else if type == "NEW"
        console.log('its new:', er.CO2)
        currRed.NEW_CO2 = er.CO2
        currRed.NEW_NOX = er.NOX
        currRed.NEW_SOX = er.SOX
        currRed.NEW_PM10 = er.PM10
      else
        currRed.PERC_CO2 = parseFloat(er.CO2)
        console.log("perc co2: ", er.CO2)
        if currRed.PERC_CO2 > 0
          
          currRed.co2EmissionsIncreased = false
        else
          currRed.PERC_CO2 = Math.abs(currRed.PERC_CO2)
          currRed.co2EmissionsIncreased = true

        currRed.PERC_NOX = parseFloat(er.NOX)
        if currRed.PERC_NOX > 0
          
          currRed.noxEmissionsIncreased = false
        else
          currRed.PERC_NOX = Math.abs(currRed.PERC_NOX)
          currRed.noxEmissionsIncreased = true

        currRed.PERC_SOX = parseFloat(er.SOX)
        if currRed.PERC_SOX > 0
          
          currRed.soxEmissionsIncreased = false
        else
          currRed.PERC_SOX = Math.abs(currRed.PERC_SOX)
          currRed.soxEmissionsIncreased = true

        currRed.PERC_PM10 = parseFloat(er.PM10)
        if currRed.PERC_PM10 > 0
          
          currRed.pmEmissionsIncreased = false
        else
          currRed.PERC_PM10 = Math.abs(currRed.PERC_PM10)
          currRed.pmEmissionsIncreased = true

      reductions[name] = currRed
    
    return reductions


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


module.exports = ProposalEmissionsTab