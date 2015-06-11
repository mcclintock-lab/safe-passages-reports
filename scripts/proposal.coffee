ProposalOverviewTab = require './proposalOverviewTab.coffee'
ProposalEmissionsTab = require './proposalEmissionsTab.coffee'
ZoneWhalesTab = require './zoneWhalesTab.coffee'
window.app.registerReport (report) ->
  report.tabs [ProposalOverviewTab, ZoneWhalesTab,ProposalEmissionsTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
