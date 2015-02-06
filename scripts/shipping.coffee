ShippingLaneTab = require './shippingLaneTab.coffee'

window.app.registerReport (report) ->
  report.tabs [ShippingLaneTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
