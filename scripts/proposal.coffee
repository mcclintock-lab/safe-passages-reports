ProposalOverviewTab = require './proposalOverviewTab.coffee'
ProposalEmissionsTab = require './proposalEmissionsTab.coffee'
WhalesTab = require './whalesTab.coffee'
window.app.registerReport (report) ->
  report.tabs [ProposalOverviewTab, WhalesTab,ProposalEmissionsTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
