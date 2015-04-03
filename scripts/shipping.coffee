OverviewTab = require './overviewTab.coffee'
WhalesTab = require './whalesTab.coffee'
EmissionsTab = require './emissionsTab.coffee'
window.app.registerReport (report) ->
  report.tabs [OverviewTab, WhalesTab, EmissionsTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
