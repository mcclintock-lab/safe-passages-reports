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
    isCollection = @model.isCollection()
    emissions = @recordSet('EmissionsReduction', 'Emissions').toArray()    
    reductions = @parseReductions emissions
    

    emissionsReductions = []
    for key in Object.keys(reductions)
      emissionsReductions.push(reductions[key])

    context =
      sketchClass: @app.sketchClasses.get(@model.get 'sketchclass').forTemplate()
      sketch: @model.forTemplate()
      emissionsReductions: emissionsReductions
      isCollection: isCollection

    @$el.html @template.render context, @partials

    @enableLayerTogglers(@$el)

  roundValue: (value, addApprox, isPounds) =>
    if value < 1 and !isPounds
      return "< 1 ton"
    else
      rval = Math.round(value)
      if isPounds
        tval = "pound"
      else
        tval = "ton"

      if rval != 1
        tval = tval+"s"

      if addApprox
        return "approximately "+rval+" "+tval
      else
        return rval+" "+tval

  parseReductions: (emissions) =>
    reductions = {}
    pos = "positive"
    neg = "negative"
    nochange = "nochange"
    for er in emissions
      name = er.NAME
      type = er.NEW_OR_OLD
      if reductions[name]
        currRed = reductions[name]
      else
        currRed = {"NAME":name}

      if type == "ORIG"
        currRed.ORIG_CO2 = @roundValue(er.CO2, false, false)
        currRed.ORIG_NOX = @roundValue(er.NOX, false, false)
        currRed.ORIG_SOX = @roundValue(er.SOX, false, false)
        currRed.ORIG_PM10 = @roundValue(er.PM10*2000, false, true)
      else if type == "NEW"
        currRed.NEW_CO2 = @roundValue(er.CO2, true, false)
        currRed.NEW_NOX = @roundValue(er.NOX, true, false)
        currRed.NEW_SOX = @roundValue(er.SOX, true, false)
        currRed.NEW_PM10 = @roundValue(er.PM10*2000, true, true)
      else
        currRed.PERC_CO2 = parseFloat(er.CO2)
        if currRed.PERC_CO2 > 0
          currRed.CO2_CHANGE_CLASS = neg
          currRed.co2EmissionsIncreased = false
        else
          if currRed.PERC_CO2 == 0
            currRed.NO_CO2_CHANGE = true
          else
            currRed.NO_CO2_CHANGE = false
            
          currRed.CO2_CHANGE_CLASS = pos
          currRed.PERC_CO2 = Math.abs(currRed.PERC_CO2)
          currRed.co2EmissionsIncreased = true

        currRed.PERC_NOX = parseFloat(er.NOX)
        if currRed.PERC_NOX > 0
          currRed.NOX_CHANGE_CLASS = neg
          currRed.noxEmissionsIncreased = false
        else
          if currRed.PERC_NOX == 0
            currRed.NO_NOX_CHANGE = true
          else
            currRed.NO_NOX_CHANGE = false
          
          currRed.NOX_CHANGE_CLASS = pos

          currRed.PERC_NOX = Math.abs(currRed.PERC_NOX)
          currRed.noxEmissionsIncreased = true

        currRed.PERC_SOX = parseFloat(er.SOX)
        if currRed.PERC_SOX > 0
          currRed.SOX_CHANGE_CLASS = neg
          currRed.soxEmissionsIncreased = false
        else
          if currRed.PERC_SOX == 0
            currRed.NO_SOX_CHANGE = true
          else
            currRed.NO_SOX_CHANGE = false

          currRed.SOX_CHANGE_CLASS = pos
          currRed.PERC_SOX = Math.abs(currRed.PERC_SOX)
          currRed.soxEmissionsIncreased = true

        currRed.PERC_PM10 = parseFloat(er.PM10)
        if currRed.PERC_PM10 > 0
          currRed.PM10_CHANGE_CLASS = neg
          currRed.pmEmissionsIncreased = false
        else
          if currRed.PERC_PM10 == 0
            currRed.NO_PM10_CHANGE = true
          else
            currRed.NO_PM10_CHANGE = false
          
          currRed.PM10_CHANGE_CLASS = pos

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