ZoneOverviewTab = require './zoneOverviewTab.coffee'
WhalesTab = require './whalesTab.coffee'
window.app.registerReport (report) ->
  report.tabs [ZoneOverviewTab, WhalesTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
