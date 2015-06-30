OverviewTab = require './overviewTab.coffee'
WhalesTab = require './whalesTab.coffee'
ProposalEmissionsTab = require './proposalEmissionsTab.coffee'
window.app.registerReport (report) ->
  report.tabs [OverviewTab, WhalesTab, ProposalEmissionsTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
