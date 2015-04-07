ZoneOverviewTab = require './zoneOverviewTab.coffee'
ZoneWhalesTab = require './zoneWhalesTab.coffee'
window.app.registerReport (report) ->
  report.tabs [ZoneOverviewTab, ZoneWhalesTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
