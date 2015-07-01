require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],4:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      console.log(this.data);
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    window.clearInterval(this.etaInterval);
    this.stopListening();
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
module.exports = {
  SHIPPING_LANE_ID: "54d2a8affa94e697759cbc79",
  MGMT_AREA_ID: "55230839b43a3ad42844d410"
};


},{}],12:[function(require,module,exports){
module.exports = [
  {
    id: 'Blue',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    count: 0,
    count_tot: 6094,
    count_perc: 0
  }, {
    id: 'Humpback',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    unchangedCount: 8554,
    count: 0,
    count_tot: 8554,
    count_perc: 0
  }, {
    id: 'Gray',
    name: 'Gray Whale',
    scientificName: 'Eschrichtius robustus',
    unchangedCount: 10339,
    count: 0,
    count_tot: 10339,
    count_perc: 0
  }, {
    id: 'Fin',
    name: 'Fin Whale',
    scientificName: 'Balaenoptera physalus',
    unchangedCount: 121,
    count: 0,
    count_tot: 121,
    count_perc: 0
  }, {
    id: 'Minke',
    name: 'Minke Whale',
    scientificName: 'Balaenoptera acutorostrata',
    unchangedCount: 385,
    count: 0,
    count_tot: 385,
    count_perc: 0
  }, {
    id: 'Pilot Whale',
    name: 'Pilot Whale',
    scientificName: 'Globicephala macrorhynchus',
    unchangedCount: 3,
    count: 0,
    count_tot: 3,
    count_perc: 0
  }
];


},{}],13:[function(require,module,exports){
var ProposalEmissionsTab, ProposalOverviewTab, WhalesTab;

ProposalOverviewTab = require('./proposalOverviewTab.coffee');

ProposalEmissionsTab = require('./proposalEmissionsTab.coffee');

WhalesTab = require('./whalesTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([ProposalOverviewTab, WhalesTab, ProposalEmissionsTab]);
  return report.stylesheets(['./report.css']);
});


},{"./proposalEmissionsTab.coffee":14,"./proposalOverviewTab.coffee":15,"./whalesTab.coffee":17}],14:[function(require,module,exports){
var ProposalEmissionsTab, ReportTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

sightingsTemplate = require('./sightingsTemplate.coffee');

addCommas = function(nStr) {
  var rgx, x, x1, x2;
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};

ProposalEmissionsTab = (function(_super) {
  __extends(ProposalEmissionsTab, _super);

  function ProposalEmissionsTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    this.parseReductions = __bind(this.parseReductions, this);
    this.roundValue = __bind(this.roundValue, this);
    _ref = ProposalEmissionsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ProposalEmissionsTab.prototype.name = 'Emissions';

  ProposalEmissionsTab.prototype.className = 'emissions';

  ProposalEmissionsTab.prototype.template = templates.proposalEmissions;

  ProposalEmissionsTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  ProposalEmissionsTab.prototype.dependencies = ['EmissionsReduction'];

  ProposalEmissionsTab.prototype.render = function() {
    var context, emissions, emissionsReductions, isCollection, reductions, _i, _len, _ref1;
    window.results = this.results;
    isCollection = this.model.isCollection();
    emissions = this.recordSet('EmissionsReduction', 'Emissions').toArray();
    reductions = this.parseReductions(emissions);
    emissionsReductions = [];
    _ref1 = Object.keys(reductions);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i];
      emissionsReductions.push(reductions[key]);
    }
    context = {
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      emissionsReductions: emissionsReductions,
      isCollection: isCollection
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  ProposalEmissionsTab.prototype.roundValue = function(value, addApprox, isPounds) {
    var rval, tval;
    if (value < 1 && !isPounds) {
      return "< 1 ton";
    } else {
      rval = Math.round(value);
      if (isPounds) {
        tval = "pound";
      } else {
        tval = "ton";
      }
      if (rval !== 1) {
        tval = tval + "s";
      }
      if (addApprox) {
        return "approximately " + rval + " " + tval;
      } else {
        return rval + " " + tval;
      }
    }
  };

  ProposalEmissionsTab.prototype.parseReductions = function(emissions) {
    var currRed, er, name, neg, nochange, pos, reductions, type, _i, _len;
    reductions = {};
    pos = "positive";
    neg = "negative";
    nochange = "nochange";
    for (_i = 0, _len = emissions.length; _i < _len; _i++) {
      er = emissions[_i];
      name = er.NAME;
      type = er.NEW_OR_OLD;
      if (reductions[name]) {
        currRed = reductions[name];
      } else {
        currRed = {
          "NAME": name
        };
      }
      if (type === "ORIG") {
        currRed.ORIG_CO2 = this.roundValue(er.CO2, false, false);
        currRed.ORIG_NOX = this.roundValue(er.NOX, false, false);
        currRed.ORIG_SOX = this.roundValue(er.SOX, false, false);
        currRed.ORIG_PM10 = this.roundValue(er.PM10 * 2000, false, true);
      } else if (type === "NEW") {
        currRed.NEW_CO2 = this.roundValue(er.CO2, true, false);
        currRed.NEW_NOX = this.roundValue(er.NOX, true, false);
        currRed.NEW_SOX = this.roundValue(er.SOX, true, false);
        currRed.NEW_PM10 = this.roundValue(er.PM10 * 2000, true, true);
      } else {
        currRed.PERC_CO2 = parseFloat(er.CO2);
        if (currRed.PERC_CO2 > 0) {
          currRed.CO2_CHANGE_CLASS = neg;
          currRed.co2EmissionsIncreased = false;
        } else {
          if (currRed.PERC_CO2 === 0) {
            currRed.NO_CO2_CHANGE = true;
          } else {
            currRed.NO_CO2_CHANGE = false;
          }
          currRed.CO2_CHANGE_CLASS = pos;
          currRed.PERC_CO2 = Math.abs(currRed.PERC_CO2);
          currRed.co2EmissionsIncreased = true;
        }
        currRed.PERC_NOX = parseFloat(er.NOX);
        if (currRed.PERC_NOX > 0) {
          currRed.NOX_CHANGE_CLASS = neg;
          currRed.noxEmissionsIncreased = false;
        } else {
          if (currRed.PERC_NOX === 0) {
            currRed.NO_NOX_CHANGE = true;
          } else {
            currRed.NO_NOX_CHANGE = false;
          }
          currRed.NOX_CHANGE_CLASS = pos;
          currRed.PERC_NOX = Math.abs(currRed.PERC_NOX);
          currRed.noxEmissionsIncreased = true;
        }
        currRed.PERC_SOX = parseFloat(er.SOX);
        if (currRed.PERC_SOX > 0) {
          currRed.SOX_CHANGE_CLASS = neg;
          currRed.soxEmissionsIncreased = false;
        } else {
          if (currRed.PERC_SOX === 0) {
            currRed.NO_SOX_CHANGE = true;
          } else {
            currRed.NO_SOX_CHANGE = false;
          }
          currRed.SOX_CHANGE_CLASS = pos;
          currRed.PERC_SOX = Math.abs(currRed.PERC_SOX);
          currRed.soxEmissionsIncreased = true;
        }
        currRed.PERC_PM10 = parseFloat(er.PM10);
        if (currRed.PERC_PM10 > 0) {
          currRed.PM10_CHANGE_CLASS = neg;
          currRed.pmEmissionsIncreased = false;
        } else {
          if (currRed.PERC_PM10 === 0) {
            currRed.NO_PM10_CHANGE = true;
          } else {
            currRed.NO_PM10_CHANGE = false;
          }
          currRed.PM10_CHANGE_CLASS = pos;
          currRed.PERC_PM10 = Math.abs(currRed.PERC_PM10);
          currRed.pmEmissionsIncreased = true;
        }
      }
      reductions[name] = currRed;
    }
    return reductions;
  };

  ProposalEmissionsTab.prototype._handleReportLayerClick = function(e) {
    var node, url;
    e.preventDefault();
    url = $(e.target).attr('href');
    node = window.app.projecthomepage.dataSidebar.layerTree.getNodeByUrl(url);
    if (node != null) {
      node.makeVisible();
    }
    if (node != null) {
      node.makeAllVisibleBelow();
    }
    if (node != null) {
      node.updateMap();
    }
    return false;
  };

  ProposalEmissionsTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return ProposalEmissionsTab;

})(ReportTab);

module.exports = ProposalEmissionsTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":18,"./sightingsTemplate.coffee":16,"reportTab":"a21iR2"}],15:[function(require,module,exports){
var ProposalOverviewTab, ReportTab, addCommas, key, partials, templates, val, _partials, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

addCommas = function(nStr) {
  var rgx, x, x1, x2;
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};

ProposalOverviewTab = (function(_super) {
  __extends(ProposalOverviewTab, _super);

  function ProposalOverviewTab() {
    _ref = ProposalOverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ProposalOverviewTab.prototype.name = 'Overview';

  ProposalOverviewTab.prototype.className = 'overview';

  ProposalOverviewTab.prototype.template = templates.proposalOverview;

  ProposalOverviewTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  ProposalOverviewTab.prototype.dependencies = ['ShippingLaneLengthForProposal', 'ZoneSize'];

  ProposalOverviewTab.prototype.render = function() {
    var context, hasShippingLanes, hasZones, isCollection, l, lengths, zonesizes, _i, _len;
    window.results = this.results;
    isCollection = this.model.isCollection();
    lengths = this.recordSet('ShippingLaneLengthForProposal', 'Lengths').toArray();
    hasShippingLanes = (lengths != null ? lengths.length : void 0) > 0;
    zonesizes = this.recordSet('ZoneSize', 'Size').toArray();
    hasZones = (zonesizes != null ? zonesizes.length : void 0) > 0;
    for (_i = 0, _len = lengths.length; _i < _len; _i++) {
      l = lengths[_i];
      l.NEW_LENGTH = parseFloat(l.NEW_LENGTH).toFixed(1);
    }
    context = {
      lengths: lengths,
      hasShippingLanes: hasShippingLanes,
      zones: zonesizes,
      hasZones: hasZones
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  return ProposalOverviewTab;

})(ReportTab);

module.exports = ProposalOverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":18,"reportTab":"a21iR2"}],16:[function(require,module,exports){
module.exports = [
  {
    id: 'Blue',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    count: 0,
    count_tot: 6094
  }, {
    id: 'Humpback',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    count: 0,
    count_tot: 8554
  }, {
    id: 'Gray',
    name: 'Gray Whale',
    scientificName: 'Eschrichtius robustus',
    count: 0,
    count_tot: 10339
  }, {
    id: 'Fin',
    name: 'Fin Whale',
    scientificName: 'Balaenoptera physalus',
    count: 0,
    count_tot: 121
  }, {
    id: 'Minke',
    name: 'Minke Whale',
    scientificName: 'Balaenoptera acutorostrata',
    count: 0,
    count_tot: 385
  }, {
    id: 'Pilot Whale',
    name: 'Pilot Whale',
    scientificName: 'Globicephala macrorhynchus',
    count: 0,
    count_tot: 3
  }
];


},{}],17:[function(require,module,exports){
var ReportTab, WhalesTab, addCommas, ids, key, partials, sightingsTemplate, templates, val, value, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

sightingsTemplate = require('./newSightingsTemplate.coffee');

ids = require('./ids.coffee');

for (key in ids) {
  value = ids[key];
  window[key] = value;
}

addCommas = function(nStr) {
  var rgx, x, x1, x2;
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};

WhalesTab = (function(_super) {
  __extends(WhalesTab, _super);

  function WhalesTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    _ref = WhalesTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  WhalesTab.prototype.name = 'Whales';

  WhalesTab.prototype.className = 'whales';

  WhalesTab.prototype.template = templates.whales;

  WhalesTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  WhalesTab.prototype.dependencies = ['SensitiveWhaleOverlap', 'WhaleOverlapTool', 'RedfernWhaleToolbox'];

  WhalesTab.prototype.render = function() {
    var context, hasManagementAreas, hasNAs, hasOtherWhales, hasShippingLanes, mgmt_area_whales, other_whales, rec, redfern_whales, sensitiveWhales, shipping_lane_whales, whaleSightings, whales_in_mgmt_areas, whales_in_other_areas, whales_in_shipping_lanes, _i, _j, _k, _len, _len1, _len2;
    window.results = this.results;
    sensitiveWhales = this.recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray();
    this.loadSensitiveWhaleData(sensitiveWhales);
    redfern_whales = this.recordSet('RedfernWhaleToolbox', 'RefernWhale').toArray();
    this.loadRedfernWhaleData(redfern_whales);
    whaleSightings = this.recordSet('WhaleOverlapTool', 'WhaleCount').toArray();
    hasNAs = false;
    whales_in_mgmt_areas = _.filter(whaleSightings, function(row) {
      return row.SC_ID === MGMT_AREA_ID;
    });
    hasManagementAreas = (whales_in_mgmt_areas != null ? whales_in_mgmt_areas.length : void 0) > 0;
    mgmt_area_whales = _.map(sightingsTemplate, function(s) {
      return _.clone(s);
    });
    this.loadSightingsData(mgmt_area_whales, whales_in_mgmt_areas);
    for (_i = 0, _len = mgmt_area_whales.length; _i < _len; _i++) {
      rec = mgmt_area_whales[_i];
      if (rec.is_na) {
        hasNAs = true;
        break;
      }
    }
    whales_in_shipping_lanes = _.filter(whaleSightings, function(row) {
      return row.SC_ID === SHIPPING_LANE_ID;
    });
    hasShippingLanes = (whales_in_shipping_lanes != null ? whales_in_shipping_lanes.length : void 0) > 0;
    shipping_lane_whales = _.map(sightingsTemplate, function(s) {
      return _.clone(s);
    });
    this.loadSightingsData(shipping_lane_whales, whales_in_shipping_lanes);
    if (!hasNAs) {
      for (_j = 0, _len1 = shipping_lane_whales.length; _j < _len1; _j++) {
        rec = shipping_lane_whales[_j];
        if (rec.is_na) {
          hasNAs = true;
          break;
        }
      }
    }
    whales_in_other_areas = _.filter(whaleSightings, function(row) {
      return row.SC_ID !== SHIPPING_LANE_ID && row.SC_ID !== MGMT_AREA_ID;
    });
    hasOtherWhales = (whales_in_other_areas != null ? whales_in_other_areas.length : void 0) > 0;
    other_whales = _.map(sightingsTemplate, function(s) {
      return _.clone(s);
    });
    this.loadSightingsData(other_whales, whales_in_other_areas);
    if (!hasNAs) {
      for (_k = 0, _len2 = other_whales.length; _k < _len2; _k++) {
        rec = other_whales[_k];
        if (rec.is_na) {
          hasNAs = true;
          break;
        }
      }
    }
    context = {
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      mgmt_area_whales: mgmt_area_whales,
      shipping_lane_whales: shipping_lane_whales,
      other_whales: other_whales,
      hasManagementAreas: hasManagementAreas,
      hasShippingLanes: hasShippingLanes,
      hasOtherWhales: hasOtherWhales,
      sensitiveWhales: sensitiveWhales,
      hasNAs: hasNAs,
      redfern_whales: redfern_whales
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  WhalesTab.prototype.get_whale_species = function(common_name) {
    var mapping;
    mapping = {
      'Blue': 'Balaenoptera musculus',
      'Humpback': 'Megaptera novaeangliae',
      'Gray': 'Eschrichtius robustus',
      'Fin': 'Balaenoptera physalus',
      'Minke': 'Balaenoptera acutorostrata',
      'Pilot Whale': 'Globicephala macrorhynchus'
    };
    return mapping[common_name];
  };

  WhalesTab.prototype.get_whale_name = function(common_name) {
    var mapping;
    mapping = {
      'Blue': 'Blue Whale',
      'Humpback': 'Humpback Whale',
      'Gray': 'Gray Whale',
      'Fin': 'Fin Whale',
      'Minke': 'Minke Whale',
      'Pilot Whale': 'Pilot Whale'
    };
    return mapping[common_name];
  };

  WhalesTab.prototype.get_found_whale = function(id, found_data) {
    var fd, _i, _len;
    for (_i = 0, _len = found_data.length; _i < _len; _i++) {
      fd = found_data[_i];
      if (fd.Species === id) {
        return fd;
      }
    }
    return null;
  };

  WhalesTab.prototype.is_na = function(data) {
    var record, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      record = data[_i];
      if (record.FREQUENCY === "N/A") {
        return true;
      }
    }
    return false;
  };

  WhalesTab.prototype.loadSightingsData = function(full_data, found_data) {
    var fd, record, _i, _j, _len, _len1, _results, _results1;
    if (this.is_na(found_data)) {
      _results = [];
      for (_i = 0, _len = full_data.length; _i < _len; _i++) {
        record = full_data[_i];
        _results.push(record.is_na = "N/A");
      }
      return _results;
    } else {
      _results1 = [];
      for (_j = 0, _len1 = full_data.length; _j < _len1; _j++) {
        record = full_data[_j];
        fd = this.get_found_whale(record.id, found_data);
        if (fd !== null) {
          record.count_perc = fd.count_perc;
          record.count_tot = fd.count_tot;
          _results1.push(record.count = fd.FREQUENCY);
        } else {
          _results1.push(void 0);
        }
      }
      return _results1;
    }
  };

  WhalesTab.prototype.loadRedfernWhaleData = function(data) {
    var sc_id, scd, sw, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      sw = data[_i];
      sc_id = sw.SC_ID;
      scd = this.app.sketchClasses.get(sc_id);
      sw.SC_NAME = scd.attributes.name;
      sw.BLUE_SQM = Math.round(sw.BLUE_SQM) + " sq. mi.";
      sw.FIN_SQM = Math.round(sw.FIN_SQM) + " sq. mi.";
      sw.HUMP_SQM = Math.round(sw.HUMP_SQM) + " sq. mi.";
    }
    return data;
  };

  WhalesTab.prototype.loadSensitiveWhaleData = function(data) {
    var sc_id, scd, sw, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      sw = data[_i];
      sc_id = sw.SC_ID;
      scd = this.app.sketchClasses.get(sc_id);
      sw.SC_NAME = scd.attributes.name;
      sw.BLUE_TOT = 2809;
      sw.BLUE_SQM = Math.round(sw.BLUE_SQM) + " sq. mi.";
      sw.GRAY_TOT = 50667;
      sw.GRAY_SQM = Math.round(sw.GRAY_SQM) + " sq. mi.";
      sw.HUMP_TOT = 1267;
      sw.HUMP_SQM = Math.round(sw.HUMP_SQM) + " sq. mi.";
    }
    return data;
  };

  WhalesTab.prototype._handleReportLayerClick = function(e) {
    var node, url;
    e.preventDefault();
    url = $(e.target).attr('href');
    node = window.app.projecthomepage.dataSidebar.layerTree.getNodeByUrl(url);
    if (node != null) {
      node.makeVisible();
    }
    if (node != null) {
      node.makeAllVisibleBelow();
    }
    if (node != null) {
      node.updateMap();
    }
    return false;
  };

  WhalesTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return WhalesTab;

})(ReportTab);

module.exports = WhalesTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":18,"./ids.coffee":11,"./newSightingsTemplate.coffee":12,"reportTab":"a21iR2"}],18:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["emissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!--");_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,128,546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);if(_.s(_.f("noEmissionsChange",c,p,1),c,p,0,845,976,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("              <strong>No significant change</strong> in emissions.");_.b("\n" + i);_.b("          </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noEmissionsChange",c,p,1),c,p,1,0,0,"")){_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("co2EmissionsPercentChange",c,p,0)));_.b("</span>  emissions</p>");_.b("\n" + i);_.b("    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_co2_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1300,1302,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_co2_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1641,1643,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,1981,1983,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n");};_.b("  <p><i>NOTE: These estimates should only be used for comparative purposes.  They are based on an average of container ships that transited the Santa Barbara Channel in 2013.  Estimates assume an average speed of 16 knots, and are compared to estimates for a transit via the designated IMO shipping lane.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("noxEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>NO<sub>x</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("noxEmissionsPercentChange",c,p,0)));_.b("</span> tons NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, NO<sub>x</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,2910,2912,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("pmEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>PM<sub>10</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("pmEmissionsPercentChange",c,p,0)));_.b("</span> tons PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, PM<sub>10</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,3610,3612,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"distance reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Length</h4>");_.b("\n" + i);if(_.s(_.f("noLengthChange",c,p,1),c,p,0,98,228,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"no_change\">");_.b("\n" + i);_.b("      <strong>No significant change</strong> in shipping lane length (of 158.35 miles).");_.b("\n" + i);_.b("    </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noLengthChange",c,p,1),c,p,1,0,0,"")){_.b("  	<p class=\"lane_length\"><span class=\"measure\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  	<div class=\"length_diff\">");_.b("\n" + i);_.b("  		The new shipping lane is <strong>");_.b(_.v(_.f("length",c,p,0)));_.b("</strong> nautical miles, <strong>");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</strong> nautical miles");_.b("\n" + i);_.b("  		");if(_.s(_.f("lengthIncreased",c,p,1),c,p,0,518,524,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("longer");});c.pop();}if(!_.s(_.f("lengthIncreased",c,p,1),c,p,1,0,0,"")){_.b("shorter");};_.b(" than the original shipping lane.");_.b("\n" + i);_.b("  	</div>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("intersectsRig",c,p,1),c,p,0,683,959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"54ac50fd0e7f86cf7909abd2\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n");return _.fl();;});
this["Templates"]["proposalEmissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);_.b("  	<div style=\"font-style:italic;\">");_.b("\n" + i);_.b("  		The following estimates are the result of changes in emissions based on changes to the shipping lane length");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(":");};if(_.s(_.f("isCollection",c,p,1),c,p,0,287,334,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" and the introduction of Speed Reduction Zones:");});c.pop();}_.b("\n" + i);_.b("  	</div>");_.b("\n" + i);if(_.s(_.f("emissionsReductions",c,p,1),c,p,0,390,2797,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  		<div class=\"in-report-header\">For shipping lane <div class=\"lane-name\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</div>, emission reductions are:</div>");_.b("\n" + i);_.b("	  		<div class=\"emissions-report\">");_.b("\n" + i);if(_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,0,574,764,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> CO<sub>2</sub> emissions of approximately <strong>");_.b(_.v(_.f("ORIG_CO2",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("		  			<div class=\"");_.b(_.v(_.f("CO2_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions \"><span class=\"measure\">");_.b(_.v(_.f("PERC_CO2",c,p,0)));_.b("</span> CO<sub>2</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b("</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1110,1112,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_CO2",c,p,0)));_.b("</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,0,1328,1500,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> NO<sub>x</sub> emissions of <strong>");_.b(_.v(_.f("ORIG_NOX",c,p,0)));_.b("</strong>.");_.b("\n" + i);_.b("				    </div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("NOX_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_NOX",c,p,0)));_.b("</span> NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are  ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b("</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1842,1844,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_NOX",c,p,0)));_.b("</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,0,2061,2230,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("				 ");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> PM<sub>10</sub> emissions of <strong>");_.b(_.v(_.f("ORIG_PM10",c,p,0)));_.b("</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("PM10_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_PM10",c,p,0)));_.b("</span> PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are  ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b("</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,2578,2580,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("				    	");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_PM10",c,p,0)));_.b("</strong>.</p>");_.b("\n" + i);_.b("			    	</div>");_.b("\n");};_.b("	    	</div>");_.b("\n");});c.pop();}_.b("	  <p><i>NOTE: These estimates should only be used for comparative purposes.  They are based on an average of container ships that transited the Santa Barbara Channel in 2013.  Estimates assume an average speed of 16 knots, and are compared to estimates for a transit via the designated IMO shipping lane.</i></p>");_.b("\n" + i);_.b("\n" + i);_.b("  ");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["proposalOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(_.s(_.f("hasZones",c,p,1),c,p,0,469,718,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Zone Sizes</h4>");_.b("\n" + i);if(_.s(_.f("zones",c,p,1),c,p,0,541,700,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The selected proposal contains <strong>");_.b(_.v(_.f("SC_ID",c,p,0)));_.b("</strong> sketches that total <strong>");_.b(_.v(_.f("SIZE_SQMI",c,p,0)));_.b("</strong> square miles.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n");});c.pop();}if(_.s(_.f("hasShippingLanes",c,p,1),c,p,0,753,996,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Shipping Lane Lengths</h4>");_.b("\n" + i);if(_.s(_.f("lengths",c,p,1),c,p,0,838,976,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The proposed shipping lane <strong>'");_.b(_.v(_.f("NAME",c,p,0)));_.b("'</strong> is <strong>");_.b(_.v(_.f("NEW_LENGTH",c,p,0)));_.b("</strong> miles long.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n");});c.pop();}return _.fl();;});
this["Templates"]["shippingLaneReport"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("intersectsRig",c,p,1),c,p,0,18,294,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f2b455c96003dc13013e84\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,601,780,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"diff ");_.b(_.v(_.f("changeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"51f2b455c96003dc13013e45\">show sightings layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);_.b("  <p>The new shipping lane has a length of <strong>");_.b(_.v(_.f("new_length",c,p,0)));_.b("</strong> miles.</p>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,1180,1598,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection habitat ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Sensitive Blue Whale Habitat</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("intersectedIsobathM",c,p,0)));_.b(" square meters of sensitive habitat disturbed.</span><span class=\"change ");_.b(_.v(_.f("isobathChangeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("isobathPercentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["whales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas (BIAs)");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"54dcd2ee9d2d9ba032e35b03\">show BIA layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      Total number of sq. miles of area identified as biologically important for feeding or migrating for part of the year that overlap with the footprint of the sketched plan.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,406,971,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corp Observations</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Total number of observations recorded in the footprint of this sketched plan by the Channel Islands Naturalist Corp upon whale watching vessels.  View the effort layer to assess whether this is an appropriate data set to use to compare plans of interest.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasManagementAreas",c,p,1),c,p,0,1425,1874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Management Areas:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("mgmt_area_whales",c,p,1),c,p,0,1529,1838,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,1745,1809,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("    ");_.b("\n" + i);if(_.s(_.f("hasShippingLanes",c,p,1),c,p,0,1928,2405,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p><strong>In Shipping Lanes:</strong></p>");_.b("\n" + i);_.b("      <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("shipping_lane_whales",c,p,1),c,p,0,2038,2363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("            <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2264,2332,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("        </li>");_.b("\n");});c.pop();}_.b("      </ul>");_.b("\n");});c.pop();}if(_.s(_.f("hasOtherWhales",c,p,1),c,p,0,2450,2907,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Other Sketch Types:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("otherWhaleSightings",c,p,1),c,p,0,2559,2868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2775,2839,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasNAs",c,p,1),c,p,0,3042,3327,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p style=\"margin-top:30px;\"><sup>*</sup><i>Whale sighting counts are only applicable within the Channel Island Naturalist Corp Observation area. If at least 50% of a management area or shipping lane lies outside this region, the count values will be marked as N/A.</i>");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Whale Density Habitat Models");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5523fa79b43a3ad42844da60\">show whale density layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      This analytic calculates the sq. miles of overlap with areas of top 20% density value according to the Redfern et. al. whale density habitat models.  A greater number of sq. miles can be interpreted as a greater overlap with higher density areas.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("redfern_whales",c,p,1),c,p,0,3829,4391,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Fin\">Fin whales <span class=\"sci\">Balaenoptera physalus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("FIN_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  	<p class=\"large\">The selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,560,593,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("proposal contains zones that are ");});c.pop();}_.b("\n" + i);_.b("  		");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" zone is ");};_.b(" <strong>");_.b(_.v(_.f("zonesize",c,p,0)));_.b("</strong> square miles.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9uZXdTaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3Byb3Bvc2FsLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvcHJvcG9zYWxFbWlzc2lvbnNUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9wcm9wb3NhbE92ZXJ2aWV3VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvc2lnaHRpbmdzVGVtcGxhdGUuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy93aGFsZXNUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FD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bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNvbnNvbGUubG9nIEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJylcbiAgICAgICAgICBwYXlsb2FkU2l6ZSA9IE1hdGgucm91bmQoKChAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpIG9yIDApIC8gMTAyNCkgKiAxMDApIC8gMTAwXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJGZWF0dXJlU2V0IHNlbnQgdG8gR1Agd2VpZ2hlZCBpbiBhdCAje3BheWxvYWRTaXplfWtiXCJcbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3JcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsMTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZighXy5zKF8uZihcImRvTm90RXhwb3J0XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9O30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IFxuICBTSElQUElOR19MQU5FX0lEOiBcIjU0ZDJhOGFmZmE5NGU2OTc3NTljYmM3OVwiXG4gIE1HTVRfQVJFQV9JRDogXCI1NTIzMDgzOWI0M2EzYWQ0Mjg0NGQ0MTBcIlxuIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIHtcbiAgICBpZDogJ0JsdWUnXG4gICAgbmFtZTogJ0JsdWUgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgbXVzY3VsdXMnXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDYwOTRcbiAgICBjb3VudF9wZXJjOiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ0h1bXBiYWNrJ1xuICAgIG5hbWU6ICdIdW1wYmFjayBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ01lZ2FwdGVyYSBub3ZhZWFuZ2xpYWUnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDg1NTRcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogODU1NFxuICAgIGNvdW50X3BlcmM6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnR3JheSdcbiAgICBuYW1lOiAnR3JheSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0VzY2hyaWNodGl1cyByb2J1c3R1cydcbiAgICB1bmNoYW5nZWRDb3VudDogMTAzMzlcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogMTAzMzlcbiAgICBjb3VudF9wZXJjOiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ0ZpbidcbiAgICBuYW1lOiAnRmluIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIHBoeXNhbHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAxMjFcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogMTIxXG4gICAgY291bnRfcGVyYzogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdNaW5rZSdcbiAgICBuYW1lOiAnTWlua2UgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgYWN1dG9yb3N0cmF0YSdcbiAgICB1bmNoYW5nZWRDb3VudDogMzg1XG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDM4NVxuICAgIGNvdW50X3BlcmM6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnUGlsb3QgV2hhbGUnXG4gICAgbmFtZTogJ1BpbG90IFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnR2xvYmljZXBoYWxhIG1hY3Jvcmh5bmNodXMnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDNcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogM1xuICAgIGNvdW50X3BlcmM6IDBcbiAgfVxuXVxuXG5cbiIsIlByb3Bvc2FsT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL3Byb3Bvc2FsT3ZlcnZpZXdUYWIuY29mZmVlJ1xuUHJvcG9zYWxFbWlzc2lvbnNUYWIgPSByZXF1aXJlICcuL3Byb3Bvc2FsRW1pc3Npb25zVGFiLmNvZmZlZSdcbldoYWxlc1RhYiA9IHJlcXVpcmUgJy4vd2hhbGVzVGFiLmNvZmZlZSdcbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW1Byb3Bvc2FsT3ZlcnZpZXdUYWIsIFdoYWxlc1RhYixQcm9wb3NhbEVtaXNzaW9uc1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5zaWdodGluZ3NUZW1wbGF0ZSA9IHJlcXVpcmUgJy4vc2lnaHRpbmdzVGVtcGxhdGUuY29mZmVlJ1xuXG5hZGRDb21tYXMgPSAoblN0cikgLT5cbiAgblN0ciArPSAnJ1xuICB4ID0gblN0ci5zcGxpdCgnLicpXG4gIHgxID0geFswXVxuICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICByZ3ggPSAvKFxcZCspKFxcZHszfSkvXG4gIHdoaWxlIChyZ3gudGVzdCh4MSkpXG4gICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArICcsJyArICckMicpXG4gIHJldHVybiB4MSArIHgyXG5cbmNsYXNzIFByb3Bvc2FsRW1pc3Npb25zVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbWlzc2lvbnMnXG4gIGNsYXNzTmFtZTogJ2VtaXNzaW9ucydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5wcm9wb3NhbEVtaXNzaW9uc1xuICBldmVudHM6XG4gICAgXCJjbGljayBhW3JlbD10b2dnbGUtbGF5ZXJdXCIgOiAnX2hhbmRsZVJlcG9ydExheWVyQ2xpY2snXG4gICAgXCJjbGljayBhLm1vcmVSZXN1bHRzXCI6ICAgICAgICAnb25Nb3JlUmVzdWx0c0NsaWNrJ1xuICBkZXBlbmRlbmNpZXM6IFsgJ0VtaXNzaW9uc1JlZHVjdGlvbiddXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHdpbmRvdy5yZXN1bHRzID0gQHJlc3VsdHNcbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICBlbWlzc2lvbnMgPSBAcmVjb3JkU2V0KCdFbWlzc2lvbnNSZWR1Y3Rpb24nLCAnRW1pc3Npb25zJykudG9BcnJheSgpICAgIFxuICAgIHJlZHVjdGlvbnMgPSBAcGFyc2VSZWR1Y3Rpb25zIGVtaXNzaW9uc1xuICAgIFxuXG4gICAgZW1pc3Npb25zUmVkdWN0aW9ucyA9IFtdXG4gICAgZm9yIGtleSBpbiBPYmplY3Qua2V5cyhyZWR1Y3Rpb25zKVxuICAgICAgZW1pc3Npb25zUmVkdWN0aW9ucy5wdXNoKHJlZHVjdGlvbnNba2V5XSlcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoQ2xhc3M6IEBhcHAuc2tldGNoQ2xhc3Nlcy5nZXQoQG1vZGVsLmdldCAnc2tldGNoY2xhc3MnKS5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBlbWlzc2lvbnNSZWR1Y3Rpb25zOiBlbWlzc2lvbnNSZWR1Y3Rpb25zXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIgY29udGV4dCwgQHBhcnRpYWxzXG5cbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIHJvdW5kVmFsdWU6ICh2YWx1ZSwgYWRkQXBwcm94LCBpc1BvdW5kcykgPT5cbiAgICBpZiB2YWx1ZSA8IDEgYW5kICFpc1BvdW5kc1xuICAgICAgcmV0dXJuIFwiPCAxIHRvblwiXG4gICAgZWxzZVxuICAgICAgcnZhbCA9IE1hdGgucm91bmQodmFsdWUpXG4gICAgICBpZiBpc1BvdW5kc1xuICAgICAgICB0dmFsID0gXCJwb3VuZFwiXG4gICAgICBlbHNlXG4gICAgICAgIHR2YWwgPSBcInRvblwiXG5cbiAgICAgIGlmIHJ2YWwgIT0gMVxuICAgICAgICB0dmFsID0gdHZhbCtcInNcIlxuXG4gICAgICBpZiBhZGRBcHByb3hcbiAgICAgICAgcmV0dXJuIFwiYXBwcm94aW1hdGVseSBcIitydmFsK1wiIFwiK3R2YWxcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHJ2YWwrXCIgXCIrdHZhbFxuXG4gIHBhcnNlUmVkdWN0aW9uczogKGVtaXNzaW9ucykgPT5cbiAgICByZWR1Y3Rpb25zID0ge31cbiAgICBwb3MgPSBcInBvc2l0aXZlXCJcbiAgICBuZWcgPSBcIm5lZ2F0aXZlXCJcbiAgICBub2NoYW5nZSA9IFwibm9jaGFuZ2VcIlxuICAgIGZvciBlciBpbiBlbWlzc2lvbnNcbiAgICAgIG5hbWUgPSBlci5OQU1FXG4gICAgICB0eXBlID0gZXIuTkVXX09SX09MRFxuICAgICAgaWYgcmVkdWN0aW9uc1tuYW1lXVxuICAgICAgICBjdXJyUmVkID0gcmVkdWN0aW9uc1tuYW1lXVxuICAgICAgZWxzZVxuICAgICAgICBjdXJyUmVkID0ge1wiTkFNRVwiOm5hbWV9XG5cbiAgICAgIGlmIHR5cGUgPT0gXCJPUklHXCJcbiAgICAgICAgY3VyclJlZC5PUklHX0NPMiA9IEByb3VuZFZhbHVlKGVyLkNPMiwgZmFsc2UsIGZhbHNlKVxuICAgICAgICBjdXJyUmVkLk9SSUdfTk9YID0gQHJvdW5kVmFsdWUoZXIuTk9YLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIGN1cnJSZWQuT1JJR19TT1ggPSBAcm91bmRWYWx1ZShlci5TT1gsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgY3VyclJlZC5PUklHX1BNMTAgPSBAcm91bmRWYWx1ZShlci5QTTEwKjIwMDAsIGZhbHNlLCB0cnVlKVxuICAgICAgZWxzZSBpZiB0eXBlID09IFwiTkVXXCJcbiAgICAgICAgY3VyclJlZC5ORVdfQ08yID0gQHJvdW5kVmFsdWUoZXIuQ08yLCB0cnVlLCBmYWxzZSlcbiAgICAgICAgY3VyclJlZC5ORVdfTk9YID0gQHJvdW5kVmFsdWUoZXIuTk9YLCB0cnVlLCBmYWxzZSlcbiAgICAgICAgY3VyclJlZC5ORVdfU09YID0gQHJvdW5kVmFsdWUoZXIuU09YLCB0cnVlLCBmYWxzZSlcbiAgICAgICAgY3VyclJlZC5ORVdfUE0xMCA9IEByb3VuZFZhbHVlKGVyLlBNMTAqMjAwMCwgdHJ1ZSwgdHJ1ZSlcbiAgICAgIGVsc2VcbiAgICAgICAgY3VyclJlZC5QRVJDX0NPMiA9IHBhcnNlRmxvYXQoZXIuQ08yKVxuICAgICAgICBpZiBjdXJyUmVkLlBFUkNfQ08yID4gMFxuICAgICAgICAgIGN1cnJSZWQuQ08yX0NIQU5HRV9DTEFTUyA9IG5lZ1xuICAgICAgICAgIGN1cnJSZWQuY28yRW1pc3Npb25zSW5jcmVhc2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGN1cnJSZWQuUEVSQ19DTzIgPT0gMFxuICAgICAgICAgICAgY3VyclJlZC5OT19DTzJfQ0hBTkdFID0gdHJ1ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fQ08yX0NIQU5HRSA9IGZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICBjdXJyUmVkLkNPMl9DSEFOR0VfQ0xBU1MgPSBwb3NcbiAgICAgICAgICBjdXJyUmVkLlBFUkNfQ08yID0gTWF0aC5hYnMoY3VyclJlZC5QRVJDX0NPMilcbiAgICAgICAgICBjdXJyUmVkLmNvMkVtaXNzaW9uc0luY3JlYXNlZCA9IHRydWVcblxuICAgICAgICBjdXJyUmVkLlBFUkNfTk9YID0gcGFyc2VGbG9hdChlci5OT1gpXG4gICAgICAgIGlmIGN1cnJSZWQuUEVSQ19OT1ggPiAwXG4gICAgICAgICAgY3VyclJlZC5OT1hfQ0hBTkdFX0NMQVNTID0gbmVnXG4gICAgICAgICAgY3VyclJlZC5ub3hFbWlzc2lvbnNJbmNyZWFzZWQgPSBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgY3VyclJlZC5QRVJDX05PWCA9PSAwXG4gICAgICAgICAgICBjdXJyUmVkLk5PX05PWF9DSEFOR0UgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3VyclJlZC5OT19OT1hfQ0hBTkdFID0gZmFsc2VcbiAgICAgICAgICBcbiAgICAgICAgICBjdXJyUmVkLk5PWF9DSEFOR0VfQ0xBU1MgPSBwb3NcblxuICAgICAgICAgIGN1cnJSZWQuUEVSQ19OT1ggPSBNYXRoLmFicyhjdXJyUmVkLlBFUkNfTk9YKVxuICAgICAgICAgIGN1cnJSZWQubm94RW1pc3Npb25zSW5jcmVhc2VkID0gdHJ1ZVxuXG4gICAgICAgIGN1cnJSZWQuUEVSQ19TT1ggPSBwYXJzZUZsb2F0KGVyLlNPWClcbiAgICAgICAgaWYgY3VyclJlZC5QRVJDX1NPWCA+IDBcbiAgICAgICAgICBjdXJyUmVkLlNPWF9DSEFOR0VfQ0xBU1MgPSBuZWdcbiAgICAgICAgICBjdXJyUmVkLnNveEVtaXNzaW9uc0luY3JlYXNlZCA9IGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBjdXJyUmVkLlBFUkNfU09YID09IDBcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fU09YX0NIQU5HRSA9IHRydWVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJyUmVkLk5PX1NPWF9DSEFOR0UgPSBmYWxzZVxuXG4gICAgICAgICAgY3VyclJlZC5TT1hfQ0hBTkdFX0NMQVNTID0gcG9zXG4gICAgICAgICAgY3VyclJlZC5QRVJDX1NPWCA9IE1hdGguYWJzKGN1cnJSZWQuUEVSQ19TT1gpXG4gICAgICAgICAgY3VyclJlZC5zb3hFbWlzc2lvbnNJbmNyZWFzZWQgPSB0cnVlXG5cbiAgICAgICAgY3VyclJlZC5QRVJDX1BNMTAgPSBwYXJzZUZsb2F0KGVyLlBNMTApXG4gICAgICAgIGlmIGN1cnJSZWQuUEVSQ19QTTEwID4gMFxuICAgICAgICAgIGN1cnJSZWQuUE0xMF9DSEFOR0VfQ0xBU1MgPSBuZWdcbiAgICAgICAgICBjdXJyUmVkLnBtRW1pc3Npb25zSW5jcmVhc2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGN1cnJSZWQuUEVSQ19QTTEwID09IDBcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fUE0xMF9DSEFOR0UgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3VyclJlZC5OT19QTTEwX0NIQU5HRSA9IGZhbHNlXG4gICAgICAgICAgXG4gICAgICAgICAgY3VyclJlZC5QTTEwX0NIQU5HRV9DTEFTUyA9IHBvc1xuXG4gICAgICAgICAgY3VyclJlZC5QRVJDX1BNMTAgPSBNYXRoLmFicyhjdXJyUmVkLlBFUkNfUE0xMClcbiAgICAgICAgICBjdXJyUmVkLnBtRW1pc3Npb25zSW5jcmVhc2VkID0gdHJ1ZVxuXG4gICAgICByZWR1Y3Rpb25zW25hbWVdID0gY3VyclJlZFxuICAgICAgXG4gICAgcmV0dXJuIHJlZHVjdGlvbnNcblxuXG4gICAgIyBTaG91bGRuJ3Qgd2UgZ2l2ZSBzb21lIGZlZWRiYWNrIHRvIHRoZSB1c2VyIGlmIHRoZSBsYXllciBpc24ndCBwcmVzZW50IGluIHRoZSBsYXllciB0cmVlP1xuICBfaGFuZGxlUmVwb3J0TGF5ZXJDbGljazogKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdXJsID0gJChlLnRhcmdldCkuYXR0cignaHJlZicpXG4gICAgbm9kZSA9IHdpbmRvdy5hcHAucHJvamVjdGhvbWVwYWdlLmRhdGFTaWRlYmFyLmxheWVyVHJlZS5nZXROb2RlQnlVcmwgdXJsXG4gICAgbm9kZT8ubWFrZVZpc2libGUoKVxuICAgIG5vZGU/Lm1ha2VBbGxWaXNpYmxlQmVsb3coKVxuICAgIG5vZGU/LnVwZGF0ZU1hcCgpXG4gICAgZmFsc2VcblxuICBvbk1vcmVSZXN1bHRzQ2xpY2s6IChlKSA9PlxuICAgIGU/LnByZXZlbnREZWZhdWx0PygpXG4gICAgJChlLnRhcmdldCkuY2xvc2VzdCgnLnJlcG9ydFNlY3Rpb24nKS5yZW1vdmVDbGFzcyAnY29sbGFwc2VkJ1xuXG5cbm1vZHVsZS5leHBvcnRzID0gUHJvcG9zYWxFbWlzc2lvbnNUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuI3NpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgUHJvcG9zYWxPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLnByb3Bvc2FsT3ZlcnZpZXdcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbJ1NoaXBwaW5nTGFuZUxlbmd0aEZvclByb3Bvc2FsJywnWm9uZVNpemUnIF1cblxuICByZW5kZXI6ICgpIC0+XG4gICAgd2luZG93LnJlc3VsdHMgPSBAcmVzdWx0c1xuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgbGVuZ3RocyA9IEByZWNvcmRTZXQoJ1NoaXBwaW5nTGFuZUxlbmd0aEZvclByb3Bvc2FsJywgJ0xlbmd0aHMnKS50b0FycmF5KClcbiAgICBoYXNTaGlwcGluZ0xhbmVzID0gbGVuZ3Rocz8ubGVuZ3RoID4gMFxuICAgIHpvbmVzaXplcyA9IEByZWNvcmRTZXQoJ1pvbmVTaXplJywgJ1NpemUnKS50b0FycmF5KClcbiAgICBoYXNab25lcyA9IHpvbmVzaXplcz8ubGVuZ3RoID4gMFxuICAgIGZvciBsIGluIGxlbmd0aHNcbiAgICAgIGwuTkVXX0xFTkdUSCA9IHBhcnNlRmxvYXQobC5ORVdfTEVOR1RIKS50b0ZpeGVkKDEpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIGxlbmd0aHM6IGxlbmd0aHNcbiAgICAgIGhhc1NoaXBwaW5nTGFuZXM6IGhhc1NoaXBwaW5nTGFuZXNcbiAgICAgIHpvbmVzOiB6b25lc2l6ZXNcbiAgICAgIGhhc1pvbmVzOiBoYXNab25lc1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIgY29udGV4dCwgQHBhcnRpYWxzXG5cbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3Bvc2FsT3ZlcnZpZXdUYWIiLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAge1xuICAgIGlkOiAnQmx1ZSdcbiAgICBuYW1lOiAnQmx1ZSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0JhbGFlbm9wdGVyYSBtdXNjdWx1cydcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogNjA5NFxuICB9LFxuICB7XG4gICAgaWQ6ICdIdW1wYmFjaydcbiAgICBuYW1lOiAnSHVtcGJhY2sgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdNZWdhcHRlcmEgbm92YWVhbmdsaWFlJ1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiA4NTU0XG4gIH0sXG4gIHtcbiAgICBpZDogJ0dyYXknXG4gICAgbmFtZTogJ0dyYXkgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdFc2NocmljaHRpdXMgcm9idXN0dXMnXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDEwMzM5XG4gIH0sXG4gIHtcbiAgICBpZDogJ0ZpbidcbiAgICBuYW1lOiAnRmluIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIHBoeXNhbHVzJ1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAxMjFcbiAgfSxcbiAge1xuICAgIGlkOiAnTWlua2UnXG4gICAgbmFtZTogJ01pbmtlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIGFjdXRvcm9zdHJhdGEnXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDM4NVxuICB9LFxuICB7XG4gICAgaWQ6ICdQaWxvdCBXaGFsZSdcbiAgICBuYW1lOiAnUGlsb3QgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdHbG9iaWNlcGhhbGEgbWFjcm9yaHluY2h1cydcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogM1xuICB9XG5dXG5cblxuIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnNpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9uZXdTaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cblxuaWRzID0gcmVxdWlyZSAnLi9pZHMuY29mZmVlJ1xuXG5mb3Iga2V5LCB2YWx1ZSBvZiBpZHNcbiAgd2luZG93W2tleV0gPSB2YWx1ZVxuXG5hZGRDb21tYXMgPSAoblN0cikgLT5cbiAgblN0ciArPSAnJ1xuICB4ID0gblN0ci5zcGxpdCgnLicpXG4gIHgxID0geFswXVxuICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICByZ3ggPSAvKFxcZCspKFxcZHszfSkvXG4gIHdoaWxlIChyZ3gudGVzdCh4MSkpXG4gICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArICcsJyArICckMicpXG4gIHJldHVybiB4MSArIHgyXG5cbmNsYXNzIFdoYWxlc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnV2hhbGVzJ1xuICBjbGFzc05hbWU6ICd3aGFsZXMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMud2hhbGVzXG4gIGV2ZW50czpcbiAgICBcImNsaWNrIGFbcmVsPXRvZ2dsZS1sYXllcl1cIiA6ICdfaGFuZGxlUmVwb3J0TGF5ZXJDbGljaydcbiAgICBcImNsaWNrIGEubW9yZVJlc3VsdHNcIjogICAgICAgICdvbk1vcmVSZXN1bHRzQ2xpY2snXG4gIGRlcGVuZGVuY2llczogWydTZW5zaXRpdmVXaGFsZU92ZXJsYXAnLCAnV2hhbGVPdmVybGFwVG9vbCcsICdSZWRmZXJuV2hhbGVUb29sYm94J11cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG4gICAgc2Vuc2l0aXZlV2hhbGVzID0gQHJlY29yZFNldCgnU2Vuc2l0aXZlV2hhbGVPdmVybGFwJywgJ1NlbnNpdGl2ZVdoYWxlJykudG9BcnJheSgpXG4gICAgQGxvYWRTZW5zaXRpdmVXaGFsZURhdGEgc2Vuc2l0aXZlV2hhbGVzXG5cbiAgICByZWRmZXJuX3doYWxlcyA9IEByZWNvcmRTZXQoJ1JlZGZlcm5XaGFsZVRvb2xib3gnLCAnUmVmZXJuV2hhbGUnKS50b0FycmF5KClcblxuICAgIEBsb2FkUmVkZmVybldoYWxlRGF0YSByZWRmZXJuX3doYWxlc1xuXG4gICAgd2hhbGVTaWdodGluZ3MgPSBAcmVjb3JkU2V0KCdXaGFsZU92ZXJsYXBUb29sJywgJ1doYWxlQ291bnQnKS50b0FycmF5KClcbiAgICBoYXNOQXMgPSBmYWxzZVxuXG4gICAgd2hhbGVzX2luX21nbXRfYXJlYXMgPSBfLmZpbHRlciB3aGFsZVNpZ2h0aW5ncywgKHJvdykgLT4gcm93LlNDX0lEID09IE1HTVRfQVJFQV9JRCAgICAgXG4gICAgaGFzTWFuYWdlbWVudEFyZWFzID0gd2hhbGVzX2luX21nbXRfYXJlYXM/Lmxlbmd0aCA+IDBcbiAgICBtZ210X2FyZWFfd2hhbGVzID0gXy5tYXAgc2lnaHRpbmdzVGVtcGxhdGUsIChzKSAtPiBfLmNsb25lKHMpXG4gICAgQGxvYWRTaWdodGluZ3NEYXRhIG1nbXRfYXJlYV93aGFsZXMsIHdoYWxlc19pbl9tZ210X2FyZWFzXG4gICAgZm9yIHJlYyBpbiBtZ210X2FyZWFfd2hhbGVzXG4gICAgICBpZiByZWMuaXNfbmFcbiAgICAgICAgaGFzTkFzID0gdHJ1ZVxuICAgICAgICBicmVha1xuXG4gICAgd2hhbGVzX2luX3NoaXBwaW5nX2xhbmVzID0gXy5maWx0ZXIgd2hhbGVTaWdodGluZ3MsIChyb3cpIC0+IChyb3cuU0NfSUQgPT0gU0hJUFBJTkdfTEFORV9JRClcbiAgICBoYXNTaGlwcGluZ0xhbmVzID0gd2hhbGVzX2luX3NoaXBwaW5nX2xhbmVzPy5sZW5ndGggPiAwXG4gICAgc2hpcHBpbmdfbGFuZV93aGFsZXMgPSBfLm1hcCBzaWdodGluZ3NUZW1wbGF0ZSwgKHMpIC0+IF8uY2xvbmUocylcbiAgICBAbG9hZFNpZ2h0aW5nc0RhdGEgc2hpcHBpbmdfbGFuZV93aGFsZXMsIHdoYWxlc19pbl9zaGlwcGluZ19sYW5lc1xuICAgIGlmICFoYXNOQXNcbiAgICAgIGZvciByZWMgaW4gc2hpcHBpbmdfbGFuZV93aGFsZXNcbiAgICAgICAgaWYgcmVjLmlzX25hXG4gICAgICAgICAgaGFzTkFzID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG5cbiAgICB3aGFsZXNfaW5fb3RoZXJfYXJlYXMgPSBfLmZpbHRlciB3aGFsZVNpZ2h0aW5ncywgKHJvdykgLT4gKHJvdy5TQ19JRCAhPSBTSElQUElOR19MQU5FX0lEICYmIHJvdy5TQ19JRCAhPSBNR01UX0FSRUFfSUQpXG4gICAgaGFzT3RoZXJXaGFsZXM9IHdoYWxlc19pbl9vdGhlcl9hcmVhcz8ubGVuZ3RoID4gMFxuICAgIG90aGVyX3doYWxlcyA9IF8ubWFwIHNpZ2h0aW5nc1RlbXBsYXRlLCAocykgLT4gXy5jbG9uZShzKVxuICAgIEBsb2FkU2lnaHRpbmdzRGF0YSBvdGhlcl93aGFsZXMsIHdoYWxlc19pbl9vdGhlcl9hcmVhc1xuICAgIGlmICFoYXNOQXNcbiAgICAgIGZvciByZWMgaW4gb3RoZXJfd2hhbGVzXG4gICAgICAgIGlmIHJlYy5pc19uYVxuICAgICAgICAgIGhhc05BcyA9IHRydWVcbiAgICAgICAgICBicmVha1xuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2hDbGFzczogQGFwcC5za2V0Y2hDbGFzc2VzLmdldChAbW9kZWwuZ2V0ICdza2V0Y2hjbGFzcycpLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcblxuICAgICAgbWdtdF9hcmVhX3doYWxlczogbWdtdF9hcmVhX3doYWxlc1xuICAgICAgc2hpcHBpbmdfbGFuZV93aGFsZXM6IHNoaXBwaW5nX2xhbmVfd2hhbGVzXG4gICAgICBvdGhlcl93aGFsZXM6IG90aGVyX3doYWxlc1xuXG4gICAgICBoYXNNYW5hZ2VtZW50QXJlYXM6IGhhc01hbmFnZW1lbnRBcmVhc1xuICAgICAgaGFzU2hpcHBpbmdMYW5lczogaGFzU2hpcHBpbmdMYW5lc1xuICAgICAgaGFzT3RoZXJXaGFsZXM6IGhhc090aGVyV2hhbGVzXG5cbiAgICAgIHNlbnNpdGl2ZVdoYWxlczogc2Vuc2l0aXZlV2hhbGVzXG4gICAgICBoYXNOQXM6IGhhc05Bc1xuXG4gICAgICByZWRmZXJuX3doYWxlczogcmVkZmVybl93aGFsZXNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cblxuICBnZXRfd2hhbGVfc3BlY2llczogKGNvbW1vbl9uYW1lKSAtPlxuICAgIG1hcHBpbmcgPSB7J0JsdWUnOidCYWxhZW5vcHRlcmEgbXVzY3VsdXMnLCAnSHVtcGJhY2snOidNZWdhcHRlcmEgbm92YWVhbmdsaWFlJywnR3JheSc6J0VzY2hyaWNodGl1cyByb2J1c3R1cycsJ0Zpbic6J0JhbGFlbm9wdGVyYSBwaHlzYWx1cycsJ01pbmtlJzonQmFsYWVub3B0ZXJhIGFjdXRvcm9zdHJhdGEnLCdQaWxvdCBXaGFsZSc6J0dsb2JpY2VwaGFsYSBtYWNyb3JoeW5jaHVzJ31cbiAgICByZXR1cm4gbWFwcGluZ1tjb21tb25fbmFtZV1cbiAgXG4gIGdldF93aGFsZV9uYW1lOiAoY29tbW9uX25hbWUpIC0+XG4gICAgbWFwcGluZyA9IHsnQmx1ZSc6J0JsdWUgV2hhbGUnLCAnSHVtcGJhY2snOidIdW1wYmFjayBXaGFsZScsJ0dyYXknOidHcmF5IFdoYWxlJywnRmluJzonRmluIFdoYWxlJywnTWlua2UnOidNaW5rZSBXaGFsZScsJ1BpbG90IFdoYWxlJzonUGlsb3QgV2hhbGUnfVxuICAgIHJldHVybiBtYXBwaW5nW2NvbW1vbl9uYW1lXVxuXG4gIGdldF9mb3VuZF93aGFsZTogKGlkLCBmb3VuZF9kYXRhKSAtPlxuICAgIGZvciBmZCBpbiBmb3VuZF9kYXRhXG4gICAgICBpZiBmZC5TcGVjaWVzID09IGlkXG4gICAgICAgIHJldHVybiBmZFxuICAgIHJldHVybiBudWxsXG5cbiAgaXNfbmE6IChkYXRhKSAtPlxuICAgIGZvciByZWNvcmQgaW4gZGF0YVxuICAgICAgaWYgcmVjb3JkLkZSRVFVRU5DWSA9PSBcIk4vQVwiXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgbG9hZFNpZ2h0aW5nc0RhdGE6IChmdWxsX2RhdGEsIGZvdW5kX2RhdGEpIC0+XG4gICAgaWYgQGlzX25hKGZvdW5kX2RhdGEpXG4gICAgICBmb3IgcmVjb3JkIGluIGZ1bGxfZGF0YVxuICAgICAgICByZWNvcmQuaXNfbmEgPSBcIk4vQVwiXG4gICAgZWxzZVxuICAgICAgZm9yIHJlY29yZCBpbiBmdWxsX2RhdGFcbiAgICAgICAgZmQgPSBAZ2V0X2ZvdW5kX3doYWxlKHJlY29yZC5pZCwgZm91bmRfZGF0YSlcbiAgICAgICAgaWYgZmQgIT0gbnVsbFxuICAgICAgICAgIHJlY29yZC5jb3VudF9wZXJjID0gZmQuY291bnRfcGVyY1xuICAgICAgICAgIHJlY29yZC5jb3VudF90b3QgPSBmZC5jb3VudF90b3RcblxuICAgICAgICAgIHJlY29yZC5jb3VudCA9IGZkLkZSRVFVRU5DWVxuXG4gIGxvYWRSZWRmZXJuV2hhbGVEYXRhOiAoZGF0YSkgLT5cbiAgICBmb3Igc3cgaW4gZGF0YVxuICAgICAgc2NfaWQgPSBzdy5TQ19JRFxuICAgICAgc2NkID0gQGFwcC5za2V0Y2hDbGFzc2VzLmdldChzY19pZClcbiAgICAgIHN3LlNDX05BTUUgPSBzY2QuYXR0cmlidXRlcy5uYW1lXG4gICAgICBcbiAgICAgIHN3LkJMVUVfU1FNID0gTWF0aC5yb3VuZChzdy5CTFVFX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgICBzdy5GSU5fU1FNID0gTWF0aC5yb3VuZChzdy5GSU5fU1FNKStcIiBzcS4gbWkuXCJcbiAgICAgIHN3LkhVTVBfU1FNID0gTWF0aC5yb3VuZChzdy5IVU1QX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgXG4gICAgcmV0dXJuIGRhdGFcblxuICBsb2FkU2Vuc2l0aXZlV2hhbGVEYXRhOiAoZGF0YSkgLT5cbiAgICBmb3Igc3cgaW4gZGF0YVxuICAgICAgc2NfaWQgPSBzdy5TQ19JRFxuICAgICAgc2NkID0gQGFwcC5za2V0Y2hDbGFzc2VzLmdldChzY19pZClcbiAgICAgIHN3LlNDX05BTUUgPSBzY2QuYXR0cmlidXRlcy5uYW1lXG4gICAgICBzdy5CTFVFX1RPVCA9IDI4MDlcbiAgICAgIHN3LkJMVUVfU1FNID0gTWF0aC5yb3VuZChzdy5CTFVFX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgICBzdy5HUkFZX1RPVCA9IDUwNjY3XG4gICAgICBzdy5HUkFZX1NRTSA9IE1hdGgucm91bmQoc3cuR1JBWV9TUU0pK1wiIHNxLiBtaS5cIlxuICAgICAgc3cuSFVNUF9UT1QgPSAxMjY3XG4gICAgICBzdy5IVU1QX1NRTSA9IE1hdGgucm91bmQoc3cuSFVNUF9TUU0pK1wiIHNxLiBtaS5cIlxuICAgIFxuICAgIHJldHVybiBkYXRhXG5cbiAgX2hhbmRsZVJlcG9ydExheWVyQ2xpY2s6IChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHVybCA9ICQoZS50YXJnZXQpLmF0dHIoJ2hyZWYnKVxuICAgIG5vZGUgPSB3aW5kb3cuYXBwLnByb2plY3Rob21lcGFnZS5kYXRhU2lkZWJhci5sYXllclRyZWUuZ2V0Tm9kZUJ5VXJsIHVybFxuICAgIG5vZGU/Lm1ha2VWaXNpYmxlKClcbiAgICBub2RlPy5tYWtlQWxsVmlzaWJsZUJlbG93KClcbiAgICBub2RlPy51cGRhdGVNYXAoKVxuICAgIGZhbHNlXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5yZXBvcnRTZWN0aW9uJykucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBXaGFsZXNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMjgsNTQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gZWFjaCB5ZWFyIGZvciBhbGwgdHJhbnNpdHM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNoYW5nZSBpbiBsZW5ndGhcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZnVlbFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJ0b25zRnVlbENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gZnVlbCBjb25zdW1wdGlvblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJjb3N0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPiRcIik7Xy5iKF8udihfLmYoXCJjb3N0Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiB2b3lhZ2UgY29zdHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+Tm8gc2lnbmlmaWNhbnQgZGlmZmVyZW5jZSBmcm9tIGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDAsODQ1LDk3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIm5vX2VtaXNzaW9uc19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHN0cm9uZz5ObyBzaWduaWZpY2FudCBjaGFuZ2U8L3N0cm9uZz4gaW4gZW1pc3Npb25zLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY28yRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gIGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfY28yX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMzAwLDEzMDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19jbzJfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTY0MSwxNjQzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTk4MSwxOTgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibm94RW1pc3Npb25zQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk5PPHN1Yj54PC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5veEVtaXNzaW9uc1BlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IHRvbnMgTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyOTEwLDI5MTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwicG1FbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UE08c3ViPjEwPC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInBtRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gdG9ucyBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X3BtX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDM2MTAsMzYxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5MZW5ndGg8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub0xlbmd0aENoYW5nZVwiLGMscCwxKSxjLHAsMCw5OCwyMjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxzdHJvbmc+Tm8gc2lnbmlmaWNhbnQgY2hhbmdlPC9zdHJvbmc+IGluIHNoaXBwaW5nIGxhbmUgbGVuZ3RoIChvZiAxNTguMzUgbWlsZXMpLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9MZW5ndGhDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhbmVfbGVuZ3RoXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBjbGFzcz1cXFwibGVuZ3RoX2RpZmZcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBuZXcgc2hpcHBpbmcgbGFuZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBuYXV0aWNhbCBtaWxlcywgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbmF1dGljYWwgbWlsZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcIik7aWYoXy5zKF8uZihcImxlbmd0aEluY3JlYXNlZFwiLGMscCwxKSxjLHAsMCw1MTgsNTI0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJsb25nZXJcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJsZW5ndGhJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzaG9ydGVyXCIpO307Xy5iKFwiIHRoYW4gdGhlIG9yaWdpbmFsIHNoaXBwaW5nIGxhbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbnRlcnNlY3RzUmlnXCIsYyxwLDEpLGMscCwwLDY4Myw5NTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gb2lsUmlnIHdhcm5pbmcgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9pbCBQbGF0Zm9ybSBJbnRlcnNlY3Rpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFlvdXIgcHJvcG9zYWwgb3ZlcmxhcHMgdGhlIHNhZmV0eSBhcmVhIGFyb3VuZCBhbiBvaWwgcGxhdGZvcm0hXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0YWM1MGZkMGU3Zjg2Y2Y3OTA5YWJkMlxcXCI+c2hvdyBwbGF0Zm9ybXM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wicHJvcG9zYWxFbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBzdHlsZT1cXFwiZm9udC1zdHlsZTppdGFsaWM7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgZm9sbG93aW5nIGVzdGltYXRlcyBhcmUgdGhlIHJlc3VsdCBvZiBjaGFuZ2VzIGluIGVtaXNzaW9ucyBiYXNlZCBvbiBjaGFuZ2VzIHRvIHRoZSBzaGlwcGluZyBsYW5lIGxlbmd0aFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIjpcIik7fTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDI4NywzMzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiBhbmQgdGhlIGludHJvZHVjdGlvbiBvZiBTcGVlZCBSZWR1Y3Rpb24gWm9uZXM6XCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJlbWlzc2lvbnNSZWR1Y3Rpb25zXCIsYyxwLDEpLGMscCwwLDM5MCwyNzk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkZvciBzaGlwcGluZyBsYW5lIDxkaXYgY2xhc3M9XFxcImxhbmUtbmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvZGl2PiwgZW1pc3Npb24gcmVkdWN0aW9ucyBhcmU6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0XHQ8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMtcmVwb3J0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTk9fQ08yX0NIQU5HRVwiLGMscCwxKSxjLHAsMCw1NzQsNzY0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0PHN0cm9uZz5ObyBjaGFuZ2U8L3N0cm9uZz4gaW4gPC9zcGFuPiBDTzxzdWI+Mjwvc3ViPiBlbWlzc2lvbnMgb2YgYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfQ08yXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fQ08yX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHQgIFx0XHRcdDxkaXYgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcIkNPMl9DSEFOR0VfQ0xBU1NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zIFxcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQ08yXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBDTzxzdWI+Mjwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPkNPPHN1Yj4yPC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJjbzJFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTExMCwxMTEyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiTk9fTk9YX0NIQU5HRVwiLGMscCwxKSxjLHAsMCwxMzI4LDE1MDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICBcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDxkaXYgY2xhc3M9XFxcIm5vX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHQ8c3Ryb25nPk5vIGNoYW5nZTwvc3Ryb25nPiBpbiA8L3NwYW4+IE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfTk9YXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fTk9YX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJOT1hfQ0hBTkdFX0NMQVNTXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfTk9YXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPk5PPHN1Yj54PC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDE4NDIsMTg0NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiT1JJR19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIk5PX1BNMTBfQ0hBTkdFXCIsYyxwLDEpLGMscCwwLDIwNjEsMjIzMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHRcdFx0XHQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPGRpdiBjbGFzcz1cXFwibm9fY2hhbmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdDxzdHJvbmc+Tm8gY2hhbmdlPC9zdHJvbmc+IGluIDwvc3Bhbj4gUE08c3ViPjEwPC9zdWI+IGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfUE0xMFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19QTTEwX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJQTTEwX0NIQU5HRV9DTEFTU1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnNcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1BNMTBcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfUE0xMFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyNTc4LDI1ODAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHRcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiT1JJR19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiXHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJwcm9wb3NhbE92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDE4LDQzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDxoND5BdHRyaWJ1dGVzIGZvciBcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwyNzgsMzg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdCAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNab25lc1wiLGMscCwxKSxjLHAsMCw0NjksNzE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lIFNpemVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiem9uZXNcIixjLHAsMSksYyxwLDAsNTQxLDcwMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIHNlbGVjdGVkIHByb3Bvc2FsIGNvbnRhaW5zIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0NfSURcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc2tldGNoZXMgdGhhdCB0b3RhbCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNJWkVfU1FNSVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBzcXVhcmUgbWlsZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NoaXBwaW5nTGFuZXNcIixjLHAsMSksYyxwLDAsNzUzLDk5NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2UgcmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2hpcHBpbmcgTGFuZSBMZW5ndGhzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibGVuZ3Roc1wiLGMscCwxKSxjLHAsMCw4MzgsOTc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgcHJvcG9zZWQgc2hpcHBpbmcgbGFuZSA8c3Ryb25nPidcIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiJzwvc3Ryb25nPiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19MRU5HVEhcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbWlsZXMgbG9uZy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJzaGlwcGluZ0xhbmVSZXBvcnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImludGVyc2VjdHNSaWdcIixjLHAsMSksYyxwLDAsMTgsMjk0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIG9pbFJpZyB3YXJuaW5nIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PaWwgUGxhdGZvcm0gSW50ZXJzZWN0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBZb3VyIHByb3Bvc2FsIG92ZXJsYXBzIHRoZSBzYWZldHkgYXJlYSBhcm91bmQgYW4gb2lsIHBsYXRmb3JtIVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyYjQ1NWM5NjAwM2RjMTMwMTNlODRcXFwiPnNob3cgcGxhdGZvcm1zPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiIGNvbGxhcHNlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2hhbGUgU2lnaHRpbmdzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk51bWJlciBvZiB3aGFsZSBzaWdodGluZ3Mgd2l0aGluIHRoaXMgZm9vdHByaW50IGNvbXBhcmVkIHRvIGV4aXN0aW5nIHNoaXBwaW5nIGxhbmVzLiBTaWdodGluZ3MgYXJlIHJlY29yZGVkIGJ5IHdoYWxld2F0Y2hpbmcgdmVzc2Vscy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIndoYWxlU2lnaHRpbmdzXCIsYyxwLDEpLGMscCwwLDYwMSw3ODAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJkaWZmIFwiKTtfLmIoXy52KF8uZihcImNoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJjb3VudFxcXCI+XCIpO18uYihfLnYoXy5mKFwiY291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+PC9saT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGNsYXNzPVxcXCJtb3JlUmVzdWx0c1xcXCIgaHJlZj1cXFwiI1xcXCI+bW9yZSByZXN1bHRzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmMmI0NTVjOTYwMDNkYzEzMDEzZTQ1XFxcIj5zaG93IHNpZ2h0aW5ncyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBuZXcgc2hpcHBpbmcgbGFuZSBoYXMgYSBsZW5ndGggb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbGVuZ3RoXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IG1pbGVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMTgwLDE1OTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHAgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBlYWNoIHllYXIgZm9yIGFsbCB0cmFuc2l0czwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImRpc3RhbmNlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgY2hhbmdlIGluIGxlbmd0aFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJmdWVsXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInRvbnNGdWVsQ2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiBmdWVsIGNvbnN1bXB0aW9uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImNvc3RcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+JFwiKTtfLmIoXy52KF8uZihcImNvc3RDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGluIHZveWFnZSBjb3N0c1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNpZ25pZmljYW50RGlzdGFuY2VDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj5ObyBzaWduaWZpY2FudCBkaWZmZXJlbmNlIGZyb20gZXhpc3RpbmcgY29uZmlndXJhdGlvbi48L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBoYWJpdGF0IFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZW5zaXRpdmUgQmx1ZSBXaGFsZSBIYWJpdGF0PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiaW50ZXJzZWN0ZWRJc29iYXRoTVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWV0ZXJzIG9mIHNlbnNpdGl2ZSBoYWJpdGF0IGRpc3R1cmJlZC48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNoYW5nZSBcIik7Xy5iKF8udihfLmYoXCJpc29iYXRoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcImlzb2JhdGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wid2hhbGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2xvZ2ljYWxseSBJbXBvcnRhbnQgQXJlYXMgKEJJQXMpXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0ZGNkMmVlOWQyZDliYTAzMmUzNWIwM1xcXCI+c2hvdyBCSUEgbGF5ZXJzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVG90YWwgbnVtYmVyIG9mIHNxLiBtaWxlcyBvZiBhcmVhIGlkZW50aWZpZWQgYXMgYmlvbG9naWNhbGx5IGltcG9ydGFudCBmb3IgZmVlZGluZyBvciBtaWdyYXRpbmcgZm9yIHBhcnQgb2YgdGhlIHllYXIgdGhhdCBvdmVybGFwIHdpdGggdGhlIGZvb3RwcmludCBvZiB0aGUgc2tldGNoZWQgcGxhbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzZW5zaXRpdmVXaGFsZXNcIixjLHAsMSksYyxwLDAsNDA2LDk3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICA8cD48c3Ryb25nPkluIFwiKTtfLmIoXy52KF8uZihcIlNDX05BTUVcIixjLHAsMCkpKTtfLmIoXCJzOjwvc3Ryb25nPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkJsdWVcXFwiPkJsdWUgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPkJhbGFlbm9wdGVyYSBtdXNjdWx1czwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkJMVUVfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJHcmF5XFxcIj5HcmF5IHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5Fc2NocmljaHRpdXMgcm9idXN0dXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJHUkFZX1NRTVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICA8bGkgY2xhc3M9XFxcIkh1bXBiYWNrXFxcIj5IdW1wYmFjayB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+TWVnYXB0ZXJhIG5vdmFlYW5nbGlhZTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkhVTVBfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+ICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiIGNvbGxhcHNlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Q2hhbm5lbCBJc2xhbmRzIE5hdHVyYWxpc3QgQ29ycCBPYnNlcnZhdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRvdGFsIG51bWJlciBvZiBvYnNlcnZhdGlvbnMgcmVjb3JkZWQgaW4gdGhlIGZvb3RwcmludCBvZiB0aGlzIHNrZXRjaGVkIHBsYW4gYnkgdGhlIENoYW5uZWwgSXNsYW5kcyBOYXR1cmFsaXN0IENvcnAgdXBvbiB3aGFsZSB3YXRjaGluZyB2ZXNzZWxzLiAgVmlldyB0aGUgZWZmb3J0IGxheWVyIHRvIGFzc2VzcyB3aGV0aGVyIHRoaXMgaXMgYW4gYXBwcm9wcmlhdGUgZGF0YSBzZXQgdG8gdXNlIHRvIGNvbXBhcmUgcGxhbnMgb2YgaW50ZXJlc3QuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc01hbmFnZW1lbnRBcmVhc1wiLGMscCwxKSxjLHAsMCwxNDI1LDE4NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cD48c3Ryb25nPkluIE1hbmFnZW1lbnQgQXJlYXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1nbXRfYXJlYV93aGFsZXNcIixjLHAsMSksYyxwLDAsMTUyOSwxODM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcImNvdW50X3RvdFwiLGMscCwwKSkpO18uYihcIiAoXCIpO18uYihfLnYoXy5mKFwiY291bnRfcGVyY1wiLGMscCwwKSkpO18uYihcIiUpPC9zcGFuPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDAsMTc0NSwxODA5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2hpcHBpbmdMYW5lc1wiLGMscCwxKSxjLHAsMCwxOTI4LDI0MDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPjxzdHJvbmc+SW4gU2hpcHBpbmcgTGFuZXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2hpcHBpbmdfbGFuZV93aGFsZXNcIixjLHAsMSksYyxwLDAsMjAzOCwyMzYzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxsaSBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+XCIpO18uYihfLnYoXy5mKFwic2NpZW50aWZpY05hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc19uYVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJjb3VudF90b3RcIixjLHAsMCkpKTtfLmIoXCIgKFwiKTtfLmIoXy52KF8uZihcImNvdW50X3BlcmNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwwLDIyNjQsMjMzMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzT3RoZXJXaGFsZXNcIixjLHAsMSksYyxwLDAsMjQ1MCwyOTA3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHA+PHN0cm9uZz5JbiBPdGhlciBTa2V0Y2ggVHlwZXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm90aGVyV2hhbGVTaWdodGluZ3NcIixjLHAsMSksYyxwLDAsMjU1OSwyODY4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcImNvdW50X3RvdFwiLGMscCwwKSkpO18uYihcIiAoXCIpO18uYihfLnYoXy5mKFwiY291bnRfcGVyY1wiLGMscCwwKSkpO18uYihcIiUpPC9zcGFuPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDAsMjc3NSwyODM5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTU0MWE5YWJjZGFjNGNhYTAyNWEzYmE4XFxcIj5zaG93IGVmZm9ydCBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNOQXNcIixjLHAsMSksYyxwLDAsMzA0MiwzMzI3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgc3R5bGU9XFxcIm1hcmdpbi10b3A6MzBweDtcXFwiPjxzdXA+Kjwvc3VwPjxpPldoYWxlIHNpZ2h0aW5nIGNvdW50cyBhcmUgb25seSBhcHBsaWNhYmxlIHdpdGhpbiB0aGUgQ2hhbm5lbCBJc2xhbmQgTmF0dXJhbGlzdCBDb3JwIE9ic2VydmF0aW9uIGFyZWEuIElmIGF0IGxlYXN0IDUwJSBvZiBhIG1hbmFnZW1lbnQgYXJlYSBvciBzaGlwcGluZyBsYW5lIGxpZXMgb3V0c2lkZSB0aGlzIHJlZ2lvbiwgdGhlIGNvdW50IHZhbHVlcyB3aWxsIGJlIG1hcmtlZCBhcyBOL0EuPC9pPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XaGFsZSBEZW5zaXR5IEhhYml0YXQgTW9kZWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1MjNmYTc5YjQzYTNhZDQyODQ0ZGE2MFxcXCI+c2hvdyB3aGFsZSBkZW5zaXR5IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyBhbmFseXRpYyBjYWxjdWxhdGVzIHRoZSBzcS4gbWlsZXMgb2Ygb3ZlcmxhcCB3aXRoIGFyZWFzIG9mIHRvcCAyMCUgZGVuc2l0eSB2YWx1ZSBhY2NvcmRpbmcgdG8gdGhlIFJlZGZlcm4gZXQuIGFsLiB3aGFsZSBkZW5zaXR5IGhhYml0YXQgbW9kZWxzLiAgQSBncmVhdGVyIG51bWJlciBvZiBzcS4gbWlsZXMgY2FuIGJlIGludGVycHJldGVkIGFzIGEgZ3JlYXRlciBvdmVybGFwIHdpdGggaGlnaGVyIGRlbnNpdHkgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVkZmVybl93aGFsZXNcIixjLHAsMSksYyxwLDAsMzgyOSw0MzkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwPjxzdHJvbmc+SW4gXCIpO18uYihfLnYoXy5mKFwiU0NfTkFNRVwiLGMscCwwKSkpO18uYihcInM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxsaSBjbGFzcz1cXFwiQmx1ZVxcXCI+Qmx1ZSB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+QmFsYWVub3B0ZXJhIG11c2N1bHVzPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPjxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiQkxVRV9TUU1cIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkZpblxcXCI+RmluIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5CYWxhZW5vcHRlcmEgcGh5c2FsdXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJGSU5fU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgIDxsaSBjbGFzcz1cXFwiSHVtcGJhY2tcXFwiPkh1bXBiYWNrIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5NZWdhcHRlcmEgbm92YWVhbmdsaWFlPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPjxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiSFVNUF9TUU1cIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT4gIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ6b25lT3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMTgsNDM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PGg0PkF0dHJpYnV0ZXMgZm9yIFwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPlZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDI3OCwzODQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGUgc2VsZWN0ZWQgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNTYwLDU5MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwicHJvcG9zYWwgY29udGFpbnMgem9uZXMgdGhhdCBhcmUgXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0XCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIHpvbmUgaXMgXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiem9uZXNpemVcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc3F1YXJlIG1pbGVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
