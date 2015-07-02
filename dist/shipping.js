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
var OverviewTab, ReportTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
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

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  OverviewTab.prototype.dependencies = ['ShippingLaneReport'];

  OverviewTab.prototype.render = function() {
    var context, existingLength, isCollection, length, lengthChange, lengthChangeClass, lengthIncreased, noLengthChange, overlapsRig, percentChange, rig, rigIntersections, rigs, _i, _len, _ref1;
    window.results = this.results;
    isCollection = this.model.isCollection();
    existingLength = 158.35;
    length = parseFloat(this.recordSet('ShippingLaneReport', 'NewLength').data.value);
    console.log("new length: ", length);
    percentChange = Math.abs(((existingLength - length) / length) * 100);
    lengthIncreased = existingLength - length < 0;
    lengthChange = Math.round(Math.abs(existingLength - length));
    lengthChangeClass = lengthIncreased ? 'positive' : 'negative';
    if (Math.abs(existingLength - length) < 0.01) {
      lengthChangeClass = 'nochange';
      noLengthChange = true;
    } else {
      noLengthChange = false;
      console.log("length diff: ", Math.abs(existingLength - length));
    }
    length = length.toFixed(2);
    rigs = this.recordSet('ShippingLaneReport', 'RigsNear');
    rigIntersections = 0;
    _ref1 = rigs.toArray();
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      rig = _ref1[_i];
      if (rig.NEAR_DIST < 500) {
        rigIntersections = rigIntersections + 1;
      }
    }
    overlapsRig = rigIntersections > 0;
    context = {
      intersectsRig: overlapsRig,
      length: length,
      existingLength: Math.round(existingLength),
      lengthChangeClass: lengthChangeClass,
      lengthIncreased: lengthIncreased,
      lengthChange: lengthChange,
      noLengthChange: noLengthChange,
      percentChange: Math.round(percentChange)
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  OverviewTab.prototype._handleReportLayerClick = function(e) {
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

  OverviewTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":18,"./sightingsTemplate.coffee":16,"reportTab":"a21iR2"}],14:[function(require,module,exports){
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
var OverviewTab, ProposalEmissionsTab, WhalesTab;

OverviewTab = require('./overviewTab.coffee');

WhalesTab = require('./whalesTab.coffee');

ProposalEmissionsTab = require('./proposalEmissionsTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, WhalesTab, ProposalEmissionsTab]);
  return report.stylesheets(['./report.css']);
});


},{"./overviewTab.coffee":13,"./proposalEmissionsTab.coffee":14,"./whalesTab.coffee":17}],16:[function(require,module,exports){
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
    var context, hasManagementAreas, hasNAs, hasOtherWhales, hasShippingLanes, ladd_whales, mgmt_area_whales, other_whales, rec, redfern_whales, sensitiveWhales, shipping_lane_whales, whaleSightings, whales_in_mgmt_areas, whales_in_other_areas, whales_in_shipping_lanes, _i, _j, _k, _len, _len1, _len2;
    window.results = this.results;
    sensitiveWhales = this.recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray();
    this.loadSensitiveWhaleData(sensitiveWhales);
    redfern_whales = this.recordSet('RedfernWhaleToolbox', 'RefernWhale').toArray();
    ladd_whales = this.recordSet('RedfernWhaleToolbox', 'LaddWhale').toArray();
    this.loadLaddData(ladd_whales);
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
      redfern_whales: redfern_whales,
      ladd_whales: ladd_whales
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

  WhalesTab.prototype.loadLaddData = function(data) {
    var sc_id, scd, sw, _i, _len;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      sw = data[_i];
      sc_id = sw.SC_ID;
      scd = this.app.sketchClasses.get(sc_id);
      sw.SC_NAME = scd.attributes.name;
    }
    return data;
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
this["Templates"]["whales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas (BIAs)");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"54dcd2ee9d2d9ba032e35b03\">show BIA layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      Total number of sq. miles of area identified as biologically important for feeding or migrating for part of the year that overlap with the footprint of the sketched plan.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,406,971,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corp Observations</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Total number of observations recorded in the footprint of this sketched plan by the Channel Islands Naturalist Corp upon whale watching vessels.  View the effort layer to assess whether this is an appropriate data set to use to compare plans of interest.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasManagementAreas",c,p,1),c,p,0,1425,1874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Management Areas:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("mgmt_area_whales",c,p,1),c,p,0,1529,1838,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,1745,1809,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("    ");_.b("\n" + i);if(_.s(_.f("hasShippingLanes",c,p,1),c,p,0,1928,2405,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p><strong>In Shipping Lanes:</strong></p>");_.b("\n" + i);_.b("      <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("shipping_lane_whales",c,p,1),c,p,0,2038,2363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("            <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2264,2332,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("        </li>");_.b("\n");});c.pop();}_.b("      </ul>");_.b("\n");});c.pop();}if(_.s(_.f("hasOtherWhales",c,p,1),c,p,0,2450,2907,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Other Sketch Types:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("otherWhaleSightings",c,p,1),c,p,0,2559,2868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2775,2839,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasNAs",c,p,1),c,p,0,3042,3327,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p style=\"margin-top:30px;\"><sup>*</sup><i>Whale sighting counts are only applicable within the Channel Island Naturalist Corp Observation area. If at least 50% of a management area or shipping lane lies outside this region, the count values will be marked as N/A.</i>");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Whale Density Habitat Models");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5523fa79b43a3ad42844da60\">show whale density layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      This analytic calculates the sq. miles of overlap with areas of top 20% density value according to the Redfern et. al. whale density habitat models.  A greater number of sq. miles can be interpreted as a greater overlap with higher density areas.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("redfern_whales",c,p,1),c,p,0,3829,4391,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Fin\">Fin whales <span class=\"sci\">Balaenoptera physalus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("FIN_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Overlap with Blue Whale Home Range");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5537fd6a8c5b43eb0fad2c07\">show layer</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      Overlap with density models developed from ARGOS satellite tracks.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("ladd_whales",c,p,1),c,p,0,4710,4834,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p class=\"large\"><strong>");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s</strong> overlap with <strong>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</strong> core areas of blue whale use.");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  	<p class=\"large\">The selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,560,593,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("proposal contains zones that are ");});c.pop();}_.b("\n" + i);_.b("  		");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" zone is ");};_.b(" <strong>");_.b(_.v(_.f("zonesize",c,p,0)));_.b("</strong> square miles.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[15])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9uZXdTaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvcHJvcG9zYWxFbWlzc2lvbnNUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9zaGlwcGluZy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvd2hhbGVzVGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxH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Q0FDRyxPQUFEOztNQUFBO0NBQ0EsS0FBQSxDQUFBLElBQUEsS0FBQTtDQXZKRixFQXFKb0I7O0NBckpwQjs7Q0FEc0I7O0FBMEp4QixDQWxMQSxFQWtMaUIsR0FBWCxDQUFOLEVBbExBOzs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIm1vZHVsZS5leHBvcnRzID0gXG4gIFNISVBQSU5HX0xBTkVfSUQ6IFwiNTRkMmE4YWZmYTk0ZTY5Nzc1OWNiYzc5XCJcbiAgTUdNVF9BUkVBX0lEOiBcIjU1MjMwODM5YjQzYTNhZDQyODQ0ZDQxMFwiXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFtcbiAge1xuICAgIGlkOiAnQmx1ZSdcbiAgICBuYW1lOiAnQmx1ZSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0JhbGFlbm9wdGVyYSBtdXNjdWx1cydcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogNjA5NFxuICAgIGNvdW50X3BlcmM6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnSHVtcGJhY2snXG4gICAgbmFtZTogJ0h1bXBiYWNrIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnTWVnYXB0ZXJhIG5vdmFlYW5nbGlhZSdcbiAgICB1bmNoYW5nZWRDb3VudDogODU1NFxuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiA4NTU0XG4gICAgY291bnRfcGVyYzogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdHcmF5J1xuICAgIG5hbWU6ICdHcmF5IFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnRXNjaHJpY2h0aXVzIHJvYnVzdHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAxMDMzOVxuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAxMDMzOVxuICAgIGNvdW50X3BlcmM6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnRmluJ1xuICAgIG5hbWU6ICdGaW4gV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgcGh5c2FsdXMnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDEyMVxuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAxMjFcbiAgICBjb3VudF9wZXJjOiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ01pbmtlJ1xuICAgIG5hbWU6ICdNaW5rZSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0JhbGFlbm9wdGVyYSBhY3V0b3Jvc3RyYXRhJ1xuICAgIHVuY2hhbmdlZENvdW50OiAzODVcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogMzg1XG4gICAgY291bnRfcGVyYzogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdQaWxvdCBXaGFsZSdcbiAgICBuYW1lOiAnUGlsb3QgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdHbG9iaWNlcGhhbGEgbWFjcm9yaHluY2h1cydcbiAgICB1bmNoYW5nZWRDb3VudDogM1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAzXG4gICAgY291bnRfcGVyYzogMFxuICB9XG5dXG5cblxuIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnNpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBldmVudHM6XG4gICAgXCJjbGljayBhW3JlbD10b2dnbGUtbGF5ZXJdXCIgOiAnX2hhbmRsZVJlcG9ydExheWVyQ2xpY2snXG4gICAgXCJjbGljayBhLm1vcmVSZXN1bHRzXCI6ICAgICAgICAnb25Nb3JlUmVzdWx0c0NsaWNrJ1xuICBkZXBlbmRlbmNpZXM6IFsnU2hpcHBpbmdMYW5lUmVwb3J0J11cblxuICByZW5kZXI6ICgpIC0+XG4gICAgd2luZG93LnJlc3VsdHMgPSBAcmVzdWx0c1xuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIGV4aXN0aW5nTGVuZ3RoID0gMTU4LjM1XG4gICAgbGVuZ3RoID0gcGFyc2VGbG9hdChAcmVjb3JkU2V0KCdTaGlwcGluZ0xhbmVSZXBvcnQnLCAnTmV3TGVuZ3RoJykuZGF0YS52YWx1ZSlcbiAgICBjb25zb2xlLmxvZyhcIm5ldyBsZW5ndGg6IFwiLCBsZW5ndGgpXG4gICAgI2xlbmd0aCA9IEBtb2RlbC5nZXQoJ2dlb21ldHJ5JykuZmVhdHVyZXNbMF0uYXR0cmlidXRlcy5TaGFwZV9MZW5ndGggLyA1MDQ4XG4gICAgcGVyY2VudENoYW5nZSA9IE1hdGguYWJzKCgoZXhpc3RpbmdMZW5ndGggLSBsZW5ndGgpIC8gbGVuZ3RoKSAqIDEwMClcbiAgICBsZW5ndGhJbmNyZWFzZWQgPSBleGlzdGluZ0xlbmd0aCAtIGxlbmd0aCA8IDBcbiAgICBsZW5ndGhDaGFuZ2UgPSBNYXRoLnJvdW5kKE1hdGguYWJzKGV4aXN0aW5nTGVuZ3RoLWxlbmd0aCkpXG4gICAgbGVuZ3RoQ2hhbmdlQ2xhc3MgPSBpZiBsZW5ndGhJbmNyZWFzZWQgdGhlbiAncG9zaXRpdmUnIGVsc2UgJ25lZ2F0aXZlJ1xuICAgIGlmIE1hdGguYWJzKGV4aXN0aW5nTGVuZ3RoIC0gbGVuZ3RoKSA8IDAuMDFcbiAgICAgIGxlbmd0aENoYW5nZUNsYXNzID0gJ25vY2hhbmdlJ1xuICAgICAgbm9MZW5ndGhDaGFuZ2UgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgbm9MZW5ndGhDaGFuZ2UgPSBmYWxzZVxuICAgICAgY29uc29sZS5sb2coXCJsZW5ndGggZGlmZjogXCIsTWF0aC5hYnMoZXhpc3RpbmdMZW5ndGggLSBsZW5ndGgpKVxuXG4gICAgbGVuZ3RoID0gbGVuZ3RoLnRvRml4ZWQoMilcbiAgICByaWdzID0gQHJlY29yZFNldCgnU2hpcHBpbmdMYW5lUmVwb3J0JywgJ1JpZ3NOZWFyJylcbiAgICByaWdJbnRlcnNlY3Rpb25zID0gMFxuICAgIGZvciByaWcgaW4gcmlncy50b0FycmF5KClcbiAgICAgIGlmIHJpZy5ORUFSX0RJU1QgPCA1MDBcbiAgICAgICAgcmlnSW50ZXJzZWN0aW9ucyA9IHJpZ0ludGVyc2VjdGlvbnMgKyAxXG4gICAgb3ZlcmxhcHNSaWcgPSByaWdJbnRlcnNlY3Rpb25zID4gMFxuXG4gICAgY29udGV4dCA9XG4gICAgICBpbnRlcnNlY3RzUmlnOiBvdmVybGFwc1JpZ1xuICAgICAgbGVuZ3RoOiBsZW5ndGggXG4gICAgICBleGlzdGluZ0xlbmd0aDogTWF0aC5yb3VuZChleGlzdGluZ0xlbmd0aClcbiAgICAgIGxlbmd0aENoYW5nZUNsYXNzOiBsZW5ndGhDaGFuZ2VDbGFzc1xuICAgICAgbGVuZ3RoSW5jcmVhc2VkOmxlbmd0aEluY3JlYXNlZFxuICAgICAgbGVuZ3RoQ2hhbmdlOmxlbmd0aENoYW5nZVxuICAgICAgbm9MZW5ndGhDaGFuZ2U6IG5vTGVuZ3RoQ2hhbmdlXG4gICAgICBwZXJjZW50Q2hhbmdlOiBNYXRoLnJvdW5kKHBlcmNlbnRDaGFuZ2UpXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlciBjb250ZXh0LCBAcGFydGlhbHNcblxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgICAjIFNob3VsZG4ndCB3ZSBnaXZlIHNvbWUgZmVlZGJhY2sgdG8gdGhlIHVzZXIgaWYgdGhlIGxheWVyIGlzbid0IHByZXNlbnQgaW4gdGhlIGxheWVyIHRyZWU/XG4gIF9oYW5kbGVSZXBvcnRMYXllckNsaWNrOiAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB1cmwgPSAkKGUudGFyZ2V0KS5hdHRyKCdocmVmJylcbiAgICBub2RlID0gd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UuZGF0YVNpZGViYXIubGF5ZXJUcmVlLmdldE5vZGVCeVVybCB1cmxcbiAgICBub2RlPy5tYWtlVmlzaWJsZSgpXG4gICAgbm9kZT8ubWFrZUFsbFZpc2libGVCZWxvdygpXG4gICAgbm9kZT8udXBkYXRlTWFwKClcbiAgICBmYWxzZVxuXG4gIG9uTW9yZVJlc3VsdHNDbGljazogKGUpID0+XG4gICAgZT8ucHJldmVudERlZmF1bHQ/KClcbiAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcucmVwb3J0U2VjdGlvbicpLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuc2lnaHRpbmdzVGVtcGxhdGUgPSByZXF1aXJlICcuL3NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSdcblxuYWRkQ29tbWFzID0gKG5TdHIpIC0+XG4gIG5TdHIgKz0gJydcbiAgeCA9IG5TdHIuc3BsaXQoJy4nKVxuICB4MSA9IHhbMF1cbiAgeDIgPSBpZiB4Lmxlbmd0aCA+IDEgdGhlbiAnLicgKyB4WzFdIGVsc2UgJydcbiAgcmd4ID0gLyhcXGQrKShcXGR7M30pL1xuICB3aGlsZSAocmd4LnRlc3QoeDEpKVxuICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICByZXR1cm4geDEgKyB4MlxuXG5jbGFzcyBQcm9wb3NhbEVtaXNzaW9uc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRW1pc3Npb25zJ1xuICBjbGFzc05hbWU6ICdlbWlzc2lvbnMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMucHJvcG9zYWxFbWlzc2lvbnNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbICdFbWlzc2lvbnNSZWR1Y3Rpb24nXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgZW1pc3Npb25zID0gQHJlY29yZFNldCgnRW1pc3Npb25zUmVkdWN0aW9uJywgJ0VtaXNzaW9ucycpLnRvQXJyYXkoKSAgICBcbiAgICByZWR1Y3Rpb25zID0gQHBhcnNlUmVkdWN0aW9ucyBlbWlzc2lvbnNcbiAgICBcblxuICAgIGVtaXNzaW9uc1JlZHVjdGlvbnMgPSBbXVxuICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMocmVkdWN0aW9ucylcbiAgICAgIGVtaXNzaW9uc1JlZHVjdGlvbnMucHVzaChyZWR1Y3Rpb25zW2tleV0pXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaENsYXNzOiBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KEBtb2RlbC5nZXQgJ3NrZXRjaGNsYXNzJykuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgZW1pc3Npb25zUmVkdWN0aW9uczogZW1pc3Npb25zUmVkdWN0aW9uc1xuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICByb3VuZFZhbHVlOiAodmFsdWUsIGFkZEFwcHJveCwgaXNQb3VuZHMpID0+XG4gICAgaWYgdmFsdWUgPCAxIGFuZCAhaXNQb3VuZHNcbiAgICAgIHJldHVybiBcIjwgMSB0b25cIlxuICAgIGVsc2VcbiAgICAgIHJ2YWwgPSBNYXRoLnJvdW5kKHZhbHVlKVxuICAgICAgaWYgaXNQb3VuZHNcbiAgICAgICAgdHZhbCA9IFwicG91bmRcIlxuICAgICAgZWxzZVxuICAgICAgICB0dmFsID0gXCJ0b25cIlxuXG4gICAgICBpZiBydmFsICE9IDFcbiAgICAgICAgdHZhbCA9IHR2YWwrXCJzXCJcblxuICAgICAgaWYgYWRkQXBwcm94XG4gICAgICAgIHJldHVybiBcImFwcHJveGltYXRlbHkgXCIrcnZhbCtcIiBcIit0dmFsXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBydmFsK1wiIFwiK3R2YWxcblxuICBwYXJzZVJlZHVjdGlvbnM6IChlbWlzc2lvbnMpID0+XG4gICAgcmVkdWN0aW9ucyA9IHt9XG4gICAgcG9zID0gXCJwb3NpdGl2ZVwiXG4gICAgbmVnID0gXCJuZWdhdGl2ZVwiXG4gICAgbm9jaGFuZ2UgPSBcIm5vY2hhbmdlXCJcbiAgICBmb3IgZXIgaW4gZW1pc3Npb25zXG4gICAgICBuYW1lID0gZXIuTkFNRVxuICAgICAgdHlwZSA9IGVyLk5FV19PUl9PTERcbiAgICAgIGlmIHJlZHVjdGlvbnNbbmFtZV1cbiAgICAgICAgY3VyclJlZCA9IHJlZHVjdGlvbnNbbmFtZV1cbiAgICAgIGVsc2VcbiAgICAgICAgY3VyclJlZCA9IHtcIk5BTUVcIjpuYW1lfVxuXG4gICAgICBpZiB0eXBlID09IFwiT1JJR1wiXG4gICAgICAgIGN1cnJSZWQuT1JJR19DTzIgPSBAcm91bmRWYWx1ZShlci5DTzIsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgY3VyclJlZC5PUklHX05PWCA9IEByb3VuZFZhbHVlKGVyLk5PWCwgZmFsc2UsIGZhbHNlKVxuICAgICAgICBjdXJyUmVkLk9SSUdfU09YID0gQHJvdW5kVmFsdWUoZXIuU09YLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIGN1cnJSZWQuT1JJR19QTTEwID0gQHJvdW5kVmFsdWUoZXIuUE0xMCoyMDAwLCBmYWxzZSwgdHJ1ZSlcbiAgICAgIGVsc2UgaWYgdHlwZSA9PSBcIk5FV1wiXG4gICAgICAgIGN1cnJSZWQuTkVXX0NPMiA9IEByb3VuZFZhbHVlKGVyLkNPMiwgdHJ1ZSwgZmFsc2UpXG4gICAgICAgIGN1cnJSZWQuTkVXX05PWCA9IEByb3VuZFZhbHVlKGVyLk5PWCwgdHJ1ZSwgZmFsc2UpXG4gICAgICAgIGN1cnJSZWQuTkVXX1NPWCA9IEByb3VuZFZhbHVlKGVyLlNPWCwgdHJ1ZSwgZmFsc2UpXG4gICAgICAgIGN1cnJSZWQuTkVXX1BNMTAgPSBAcm91bmRWYWx1ZShlci5QTTEwKjIwMDAsIHRydWUsIHRydWUpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnJSZWQuUEVSQ19DTzIgPSBwYXJzZUZsb2F0KGVyLkNPMilcbiAgICAgICAgaWYgY3VyclJlZC5QRVJDX0NPMiA+IDBcbiAgICAgICAgICBjdXJyUmVkLkNPMl9DSEFOR0VfQ0xBU1MgPSBuZWdcbiAgICAgICAgICBjdXJyUmVkLmNvMkVtaXNzaW9uc0luY3JlYXNlZCA9IGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBjdXJyUmVkLlBFUkNfQ08yID09IDBcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fQ08yX0NIQU5HRSA9IHRydWVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJyUmVkLk5PX0NPMl9DSEFOR0UgPSBmYWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgY3VyclJlZC5DTzJfQ0hBTkdFX0NMQVNTID0gcG9zXG4gICAgICAgICAgY3VyclJlZC5QRVJDX0NPMiA9IE1hdGguYWJzKGN1cnJSZWQuUEVSQ19DTzIpXG4gICAgICAgICAgY3VyclJlZC5jbzJFbWlzc2lvbnNJbmNyZWFzZWQgPSB0cnVlXG5cbiAgICAgICAgY3VyclJlZC5QRVJDX05PWCA9IHBhcnNlRmxvYXQoZXIuTk9YKVxuICAgICAgICBpZiBjdXJyUmVkLlBFUkNfTk9YID4gMFxuICAgICAgICAgIGN1cnJSZWQuTk9YX0NIQU5HRV9DTEFTUyA9IG5lZ1xuICAgICAgICAgIGN1cnJSZWQubm94RW1pc3Npb25zSW5jcmVhc2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGN1cnJSZWQuUEVSQ19OT1ggPT0gMFxuICAgICAgICAgICAgY3VyclJlZC5OT19OT1hfQ0hBTkdFID0gdHJ1ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fTk9YX0NIQU5HRSA9IGZhbHNlXG4gICAgICAgICAgXG4gICAgICAgICAgY3VyclJlZC5OT1hfQ0hBTkdFX0NMQVNTID0gcG9zXG5cbiAgICAgICAgICBjdXJyUmVkLlBFUkNfTk9YID0gTWF0aC5hYnMoY3VyclJlZC5QRVJDX05PWClcbiAgICAgICAgICBjdXJyUmVkLm5veEVtaXNzaW9uc0luY3JlYXNlZCA9IHRydWVcblxuICAgICAgICBjdXJyUmVkLlBFUkNfU09YID0gcGFyc2VGbG9hdChlci5TT1gpXG4gICAgICAgIGlmIGN1cnJSZWQuUEVSQ19TT1ggPiAwXG4gICAgICAgICAgY3VyclJlZC5TT1hfQ0hBTkdFX0NMQVNTID0gbmVnXG4gICAgICAgICAgY3VyclJlZC5zb3hFbWlzc2lvbnNJbmNyZWFzZWQgPSBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgY3VyclJlZC5QRVJDX1NPWCA9PSAwXG4gICAgICAgICAgICBjdXJyUmVkLk5PX1NPWF9DSEFOR0UgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3VyclJlZC5OT19TT1hfQ0hBTkdFID0gZmFsc2VcblxuICAgICAgICAgIGN1cnJSZWQuU09YX0NIQU5HRV9DTEFTUyA9IHBvc1xuICAgICAgICAgIGN1cnJSZWQuUEVSQ19TT1ggPSBNYXRoLmFicyhjdXJyUmVkLlBFUkNfU09YKVxuICAgICAgICAgIGN1cnJSZWQuc294RW1pc3Npb25zSW5jcmVhc2VkID0gdHJ1ZVxuXG4gICAgICAgIGN1cnJSZWQuUEVSQ19QTTEwID0gcGFyc2VGbG9hdChlci5QTTEwKVxuICAgICAgICBpZiBjdXJyUmVkLlBFUkNfUE0xMCA+IDBcbiAgICAgICAgICBjdXJyUmVkLlBNMTBfQ0hBTkdFX0NMQVNTID0gbmVnXG4gICAgICAgICAgY3VyclJlZC5wbUVtaXNzaW9uc0luY3JlYXNlZCA9IGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBjdXJyUmVkLlBFUkNfUE0xMCA9PSAwXG4gICAgICAgICAgICBjdXJyUmVkLk5PX1BNMTBfQ0hBTkdFID0gdHJ1ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fUE0xMF9DSEFOR0UgPSBmYWxzZVxuICAgICAgICAgIFxuICAgICAgICAgIGN1cnJSZWQuUE0xMF9DSEFOR0VfQ0xBU1MgPSBwb3NcblxuICAgICAgICAgIGN1cnJSZWQuUEVSQ19QTTEwID0gTWF0aC5hYnMoY3VyclJlZC5QRVJDX1BNMTApXG4gICAgICAgICAgY3VyclJlZC5wbUVtaXNzaW9uc0luY3JlYXNlZCA9IHRydWVcblxuICAgICAgcmVkdWN0aW9uc1tuYW1lXSA9IGN1cnJSZWRcbiAgICAgIFxuICAgIHJldHVybiByZWR1Y3Rpb25zXG5cblxuICAgICMgU2hvdWxkbid0IHdlIGdpdmUgc29tZSBmZWVkYmFjayB0byB0aGUgdXNlciBpZiB0aGUgbGF5ZXIgaXNuJ3QgcHJlc2VudCBpbiB0aGUgbGF5ZXIgdHJlZT9cbiAgX2hhbmRsZVJlcG9ydExheWVyQ2xpY2s6IChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHVybCA9ICQoZS50YXJnZXQpLmF0dHIoJ2hyZWYnKVxuICAgIG5vZGUgPSB3aW5kb3cuYXBwLnByb2plY3Rob21lcGFnZS5kYXRhU2lkZWJhci5sYXllclRyZWUuZ2V0Tm9kZUJ5VXJsIHVybFxuICAgIG5vZGU/Lm1ha2VWaXNpYmxlKClcbiAgICBub2RlPy5tYWtlQWxsVmlzaWJsZUJlbG93KClcbiAgICBub2RlPy51cGRhdGVNYXAoKVxuICAgIGZhbHNlXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5yZXBvcnRTZWN0aW9uJykucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3Bvc2FsRW1pc3Npb25zVGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbldoYWxlc1RhYiA9IHJlcXVpcmUgJy4vd2hhbGVzVGFiLmNvZmZlZSdcblByb3Bvc2FsRW1pc3Npb25zVGFiID0gcmVxdWlyZSAnLi9wcm9wb3NhbEVtaXNzaW9uc1RhYi5jb2ZmZWUnXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgV2hhbGVzVGFiLCBQcm9wb3NhbEVtaXNzaW9uc1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICB7XG4gICAgaWQ6ICdCbHVlJ1xuICAgIG5hbWU6ICdCbHVlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIG11c2N1bHVzJ1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiA2MDk0XG4gIH0sXG4gIHtcbiAgICBpZDogJ0h1bXBiYWNrJ1xuICAgIG5hbWU6ICdIdW1wYmFjayBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ01lZ2FwdGVyYSBub3ZhZWFuZ2xpYWUnXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDg1NTRcbiAgfSxcbiAge1xuICAgIGlkOiAnR3JheSdcbiAgICBuYW1lOiAnR3JheSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0VzY2hyaWNodGl1cyByb2J1c3R1cydcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogMTAzMzlcbiAgfSxcbiAge1xuICAgIGlkOiAnRmluJ1xuICAgIG5hbWU6ICdGaW4gV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgcGh5c2FsdXMnXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDEyMVxuICB9LFxuICB7XG4gICAgaWQ6ICdNaW5rZSdcbiAgICBuYW1lOiAnTWlua2UgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgYWN1dG9yb3N0cmF0YSdcbiAgICBjb3VudDogMFxuICAgIGNvdW50X3RvdDogMzg1XG4gIH0sXG4gIHtcbiAgICBpZDogJ1BpbG90IFdoYWxlJ1xuICAgIG5hbWU6ICdQaWxvdCBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0dsb2JpY2VwaGFsYSBtYWNyb3JoeW5jaHVzJ1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAzXG4gIH1cbl1cblxuXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuc2lnaHRpbmdzVGVtcGxhdGUgPSByZXF1aXJlICcuL25ld1NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSdcblxuXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5cbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgV2hhbGVzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdXaGFsZXMnXG4gIGNsYXNzTmFtZTogJ3doYWxlcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy53aGFsZXNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbJ1NlbnNpdGl2ZVdoYWxlT3ZlcmxhcCcsICdXaGFsZU92ZXJsYXBUb29sJywgJ1JlZGZlcm5XaGFsZVRvb2xib3gnXVxuXG4gIHJlbmRlcjogKCkgLT5cblxuICAgIHdpbmRvdy5yZXN1bHRzID0gQHJlc3VsdHNcbiAgICBzZW5zaXRpdmVXaGFsZXMgPSBAcmVjb3JkU2V0KCdTZW5zaXRpdmVXaGFsZU92ZXJsYXAnLCAnU2Vuc2l0aXZlV2hhbGUnKS50b0FycmF5KClcbiAgICBAbG9hZFNlbnNpdGl2ZVdoYWxlRGF0YSBzZW5zaXRpdmVXaGFsZXNcblxuICAgIHJlZGZlcm5fd2hhbGVzID0gQHJlY29yZFNldCgnUmVkZmVybldoYWxlVG9vbGJveCcsICdSZWZlcm5XaGFsZScpLnRvQXJyYXkoKVxuICAgIGxhZGRfd2hhbGVzID0gQHJlY29yZFNldCgnUmVkZmVybldoYWxlVG9vbGJveCcsICdMYWRkV2hhbGUnKS50b0FycmF5KClcbiAgICBAbG9hZExhZGREYXRhIGxhZGRfd2hhbGVzXG4gICAgQGxvYWRSZWRmZXJuV2hhbGVEYXRhIHJlZGZlcm5fd2hhbGVzXG5cbiAgICB3aGFsZVNpZ2h0aW5ncyA9IEByZWNvcmRTZXQoJ1doYWxlT3ZlcmxhcFRvb2wnLCAnV2hhbGVDb3VudCcpLnRvQXJyYXkoKVxuICAgIGhhc05BcyA9IGZhbHNlXG5cbiAgICB3aGFsZXNfaW5fbWdtdF9hcmVhcyA9IF8uZmlsdGVyIHdoYWxlU2lnaHRpbmdzLCAocm93KSAtPiByb3cuU0NfSUQgPT0gTUdNVF9BUkVBX0lEICAgICBcbiAgICBoYXNNYW5hZ2VtZW50QXJlYXMgPSB3aGFsZXNfaW5fbWdtdF9hcmVhcz8ubGVuZ3RoID4gMFxuICAgIG1nbXRfYXJlYV93aGFsZXMgPSBfLm1hcCBzaWdodGluZ3NUZW1wbGF0ZSwgKHMpIC0+IF8uY2xvbmUocylcbiAgICBAbG9hZFNpZ2h0aW5nc0RhdGEgbWdtdF9hcmVhX3doYWxlcywgd2hhbGVzX2luX21nbXRfYXJlYXNcbiAgICBmb3IgcmVjIGluIG1nbXRfYXJlYV93aGFsZXNcbiAgICAgIGlmIHJlYy5pc19uYVxuICAgICAgICBoYXNOQXMgPSB0cnVlXG4gICAgICAgIGJyZWFrXG5cbiAgICB3aGFsZXNfaW5fc2hpcHBpbmdfbGFuZXMgPSBfLmZpbHRlciB3aGFsZVNpZ2h0aW5ncywgKHJvdykgLT4gKHJvdy5TQ19JRCA9PSBTSElQUElOR19MQU5FX0lEKVxuICAgIGhhc1NoaXBwaW5nTGFuZXMgPSB3aGFsZXNfaW5fc2hpcHBpbmdfbGFuZXM/Lmxlbmd0aCA+IDBcbiAgICBzaGlwcGluZ19sYW5lX3doYWxlcyA9IF8ubWFwIHNpZ2h0aW5nc1RlbXBsYXRlLCAocykgLT4gXy5jbG9uZShzKVxuICAgIEBsb2FkU2lnaHRpbmdzRGF0YSBzaGlwcGluZ19sYW5lX3doYWxlcywgd2hhbGVzX2luX3NoaXBwaW5nX2xhbmVzXG4gICAgaWYgIWhhc05Bc1xuICAgICAgZm9yIHJlYyBpbiBzaGlwcGluZ19sYW5lX3doYWxlc1xuICAgICAgICBpZiByZWMuaXNfbmFcbiAgICAgICAgICBoYXNOQXMgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcblxuICAgIHdoYWxlc19pbl9vdGhlcl9hcmVhcyA9IF8uZmlsdGVyIHdoYWxlU2lnaHRpbmdzLCAocm93KSAtPiAocm93LlNDX0lEICE9IFNISVBQSU5HX0xBTkVfSUQgJiYgcm93LlNDX0lEICE9IE1HTVRfQVJFQV9JRClcbiAgICBoYXNPdGhlcldoYWxlcz0gd2hhbGVzX2luX290aGVyX2FyZWFzPy5sZW5ndGggPiAwXG4gICAgb3RoZXJfd2hhbGVzID0gXy5tYXAgc2lnaHRpbmdzVGVtcGxhdGUsIChzKSAtPiBfLmNsb25lKHMpXG4gICAgQGxvYWRTaWdodGluZ3NEYXRhIG90aGVyX3doYWxlcywgd2hhbGVzX2luX290aGVyX2FyZWFzXG4gICAgaWYgIWhhc05Bc1xuICAgICAgZm9yIHJlYyBpbiBvdGhlcl93aGFsZXNcbiAgICAgICAgaWYgcmVjLmlzX25hXG4gICAgICAgICAgaGFzTkFzID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaENsYXNzOiBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KEBtb2RlbC5nZXQgJ3NrZXRjaGNsYXNzJykuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuXG4gICAgICBtZ210X2FyZWFfd2hhbGVzOiBtZ210X2FyZWFfd2hhbGVzXG4gICAgICBzaGlwcGluZ19sYW5lX3doYWxlczogc2hpcHBpbmdfbGFuZV93aGFsZXNcbiAgICAgIG90aGVyX3doYWxlczogb3RoZXJfd2hhbGVzXG5cbiAgICAgIGhhc01hbmFnZW1lbnRBcmVhczogaGFzTWFuYWdlbWVudEFyZWFzXG4gICAgICBoYXNTaGlwcGluZ0xhbmVzOiBoYXNTaGlwcGluZ0xhbmVzXG4gICAgICBoYXNPdGhlcldoYWxlczogaGFzT3RoZXJXaGFsZXNcblxuICAgICAgc2Vuc2l0aXZlV2hhbGVzOiBzZW5zaXRpdmVXaGFsZXNcbiAgICAgIGhhc05BczogaGFzTkFzXG5cbiAgICAgIHJlZGZlcm5fd2hhbGVzOiByZWRmZXJuX3doYWxlc1xuICAgICAgbGFkZF93aGFsZXM6IGxhZGRfd2hhbGVzXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlciBjb250ZXh0LCBAcGFydGlhbHNcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG5cbiAgZ2V0X3doYWxlX3NwZWNpZXM6IChjb21tb25fbmFtZSkgLT5cbiAgICBtYXBwaW5nID0geydCbHVlJzonQmFsYWVub3B0ZXJhIG11c2N1bHVzJywgJ0h1bXBiYWNrJzonTWVnYXB0ZXJhIG5vdmFlYW5nbGlhZScsJ0dyYXknOidFc2NocmljaHRpdXMgcm9idXN0dXMnLCdGaW4nOidCYWxhZW5vcHRlcmEgcGh5c2FsdXMnLCdNaW5rZSc6J0JhbGFlbm9wdGVyYSBhY3V0b3Jvc3RyYXRhJywnUGlsb3QgV2hhbGUnOidHbG9iaWNlcGhhbGEgbWFjcm9yaHluY2h1cyd9XG4gICAgcmV0dXJuIG1hcHBpbmdbY29tbW9uX25hbWVdXG4gIFxuICBnZXRfd2hhbGVfbmFtZTogKGNvbW1vbl9uYW1lKSAtPlxuICAgIG1hcHBpbmcgPSB7J0JsdWUnOidCbHVlIFdoYWxlJywgJ0h1bXBiYWNrJzonSHVtcGJhY2sgV2hhbGUnLCdHcmF5JzonR3JheSBXaGFsZScsJ0Zpbic6J0ZpbiBXaGFsZScsJ01pbmtlJzonTWlua2UgV2hhbGUnLCdQaWxvdCBXaGFsZSc6J1BpbG90IFdoYWxlJ31cbiAgICByZXR1cm4gbWFwcGluZ1tjb21tb25fbmFtZV1cblxuICBnZXRfZm91bmRfd2hhbGU6IChpZCwgZm91bmRfZGF0YSkgLT5cbiAgICBmb3IgZmQgaW4gZm91bmRfZGF0YVxuICAgICAgaWYgZmQuU3BlY2llcyA9PSBpZFxuICAgICAgICByZXR1cm4gZmRcbiAgICByZXR1cm4gbnVsbFxuXG4gIGlzX25hOiAoZGF0YSkgLT5cbiAgICBmb3IgcmVjb3JkIGluIGRhdGFcbiAgICAgIGlmIHJlY29yZC5GUkVRVUVOQ1kgPT0gXCJOL0FcIlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGxvYWRTaWdodGluZ3NEYXRhOiAoZnVsbF9kYXRhLCBmb3VuZF9kYXRhKSAtPlxuICAgIGlmIEBpc19uYShmb3VuZF9kYXRhKVxuICAgICAgZm9yIHJlY29yZCBpbiBmdWxsX2RhdGFcbiAgICAgICAgcmVjb3JkLmlzX25hID0gXCJOL0FcIlxuICAgIGVsc2VcbiAgICAgIGZvciByZWNvcmQgaW4gZnVsbF9kYXRhXG4gICAgICAgIGZkID0gQGdldF9mb3VuZF93aGFsZShyZWNvcmQuaWQsIGZvdW5kX2RhdGEpXG4gICAgICAgIGlmIGZkICE9IG51bGxcbiAgICAgICAgICByZWNvcmQuY291bnRfcGVyYyA9IGZkLmNvdW50X3BlcmNcbiAgICAgICAgICByZWNvcmQuY291bnRfdG90ID0gZmQuY291bnRfdG90XG5cbiAgICAgICAgICByZWNvcmQuY291bnQgPSBmZC5GUkVRVUVOQ1lcblxuICBsb2FkTGFkZERhdGE6IChkYXRhKSAtPlxuICAgIGZvciBzdyBpbiBkYXRhXG4gICAgICBzY19pZCA9IHN3LlNDX0lEXG4gICAgICBzY2QgPSBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KHNjX2lkKVxuICAgICAgc3cuU0NfTkFNRSA9IHNjZC5hdHRyaWJ1dGVzLm5hbWVcbiAgICBcbiAgICByZXR1cm4gZGF0YVxuXG4gIGxvYWRSZWRmZXJuV2hhbGVEYXRhOiAoZGF0YSkgLT5cbiAgICBmb3Igc3cgaW4gZGF0YVxuICAgICAgc2NfaWQgPSBzdy5TQ19JRFxuICAgICAgc2NkID0gQGFwcC5za2V0Y2hDbGFzc2VzLmdldChzY19pZClcbiAgICAgIHN3LlNDX05BTUUgPSBzY2QuYXR0cmlidXRlcy5uYW1lXG4gICAgICBcbiAgICAgIHN3LkJMVUVfU1FNID0gTWF0aC5yb3VuZChzdy5CTFVFX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgICBzdy5GSU5fU1FNID0gTWF0aC5yb3VuZChzdy5GSU5fU1FNKStcIiBzcS4gbWkuXCJcbiAgICAgIHN3LkhVTVBfU1FNID0gTWF0aC5yb3VuZChzdy5IVU1QX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgXG4gICAgcmV0dXJuIGRhdGFcblxuICBsb2FkU2Vuc2l0aXZlV2hhbGVEYXRhOiAoZGF0YSkgLT5cbiAgICBmb3Igc3cgaW4gZGF0YVxuICAgICAgc2NfaWQgPSBzdy5TQ19JRFxuICAgICAgc2NkID0gQGFwcC5za2V0Y2hDbGFzc2VzLmdldChzY19pZClcbiAgICAgIHN3LlNDX05BTUUgPSBzY2QuYXR0cmlidXRlcy5uYW1lXG4gICAgICBzdy5CTFVFX1RPVCA9IDI4MDlcbiAgICAgIHN3LkJMVUVfU1FNID0gTWF0aC5yb3VuZChzdy5CTFVFX1NRTSkrXCIgc3EuIG1pLlwiXG4gICAgICBzdy5HUkFZX1RPVCA9IDUwNjY3XG4gICAgICBzdy5HUkFZX1NRTSA9IE1hdGgucm91bmQoc3cuR1JBWV9TUU0pK1wiIHNxLiBtaS5cIlxuICAgICAgc3cuSFVNUF9UT1QgPSAxMjY3XG4gICAgICBzdy5IVU1QX1NRTSA9IE1hdGgucm91bmQoc3cuSFVNUF9TUU0pK1wiIHNxLiBtaS5cIlxuICAgIFxuICAgIHJldHVybiBkYXRhXG5cbiAgX2hhbmRsZVJlcG9ydExheWVyQ2xpY2s6IChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHVybCA9ICQoZS50YXJnZXQpLmF0dHIoJ2hyZWYnKVxuICAgIG5vZGUgPSB3aW5kb3cuYXBwLnByb2plY3Rob21lcGFnZS5kYXRhU2lkZWJhci5sYXllclRyZWUuZ2V0Tm9kZUJ5VXJsIHVybFxuICAgIG5vZGU/Lm1ha2VWaXNpYmxlKClcbiAgICBub2RlPy5tYWtlQWxsVmlzaWJsZUJlbG93KClcbiAgICBub2RlPy51cGRhdGVNYXAoKVxuICAgIGZhbHNlXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5yZXBvcnRTZWN0aW9uJykucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBXaGFsZXNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMjgsNTQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gZWFjaCB5ZWFyIGZvciBhbGwgdHJhbnNpdHM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNoYW5nZSBpbiBsZW5ndGhcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZnVlbFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJ0b25zRnVlbENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gZnVlbCBjb25zdW1wdGlvblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJjb3N0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPiRcIik7Xy5iKF8udihfLmYoXCJjb3N0Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiB2b3lhZ2UgY29zdHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+Tm8gc2lnbmlmaWNhbnQgZGlmZmVyZW5jZSBmcm9tIGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDAsODQ1LDk3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIm5vX2VtaXNzaW9uc19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHN0cm9uZz5ObyBzaWduaWZpY2FudCBjaGFuZ2U8L3N0cm9uZz4gaW4gZW1pc3Npb25zLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY28yRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gIGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfY28yX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMzAwLDEzMDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19jbzJfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTY0MSwxNjQzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTk4MSwxOTgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibm94RW1pc3Npb25zQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk5PPHN1Yj54PC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5veEVtaXNzaW9uc1BlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IHRvbnMgTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyOTEwLDI5MTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwicG1FbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UE08c3ViPjEwPC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInBtRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gdG9ucyBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X3BtX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDM2MTAsMzYxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5MZW5ndGg8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub0xlbmd0aENoYW5nZVwiLGMscCwxKSxjLHAsMCw5OCwyMjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxzdHJvbmc+Tm8gc2lnbmlmaWNhbnQgY2hhbmdlPC9zdHJvbmc+IGluIHNoaXBwaW5nIGxhbmUgbGVuZ3RoIChvZiAxNTguMzUgbWlsZXMpLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9MZW5ndGhDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhbmVfbGVuZ3RoXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBjbGFzcz1cXFwibGVuZ3RoX2RpZmZcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBuZXcgc2hpcHBpbmcgbGFuZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBuYXV0aWNhbCBtaWxlcywgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbmF1dGljYWwgbWlsZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcIik7aWYoXy5zKF8uZihcImxlbmd0aEluY3JlYXNlZFwiLGMscCwxKSxjLHAsMCw1MTgsNTI0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJsb25nZXJcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJsZW5ndGhJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzaG9ydGVyXCIpO307Xy5iKFwiIHRoYW4gdGhlIG9yaWdpbmFsIHNoaXBwaW5nIGxhbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbnRlcnNlY3RzUmlnXCIsYyxwLDEpLGMscCwwLDY4Myw5NTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gb2lsUmlnIHdhcm5pbmcgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9pbCBQbGF0Zm9ybSBJbnRlcnNlY3Rpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFlvdXIgcHJvcG9zYWwgb3ZlcmxhcHMgdGhlIHNhZmV0eSBhcmVhIGFyb3VuZCBhbiBvaWwgcGxhdGZvcm0hXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0YWM1MGZkMGU3Zjg2Y2Y3OTA5YWJkMlxcXCI+c2hvdyBwbGF0Zm9ybXM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wicHJvcG9zYWxFbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBzdHlsZT1cXFwiZm9udC1zdHlsZTppdGFsaWM7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgZm9sbG93aW5nIGVzdGltYXRlcyBhcmUgdGhlIHJlc3VsdCBvZiBjaGFuZ2VzIGluIGVtaXNzaW9ucyBiYXNlZCBvbiBjaGFuZ2VzIHRvIHRoZSBzaGlwcGluZyBsYW5lIGxlbmd0aFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIjpcIik7fTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDI4NywzMzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiBhbmQgdGhlIGludHJvZHVjdGlvbiBvZiBTcGVlZCBSZWR1Y3Rpb24gWm9uZXM6XCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJlbWlzc2lvbnNSZWR1Y3Rpb25zXCIsYyxwLDEpLGMscCwwLDM5MCwyNzk3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkZvciBzaGlwcGluZyBsYW5lIDxkaXYgY2xhc3M9XFxcImxhbmUtbmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvZGl2PiwgZW1pc3Npb24gcmVkdWN0aW9ucyBhcmU6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0XHQ8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMtcmVwb3J0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTk9fQ08yX0NIQU5HRVwiLGMscCwxKSxjLHAsMCw1NzQsNzY0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0PHN0cm9uZz5ObyBjaGFuZ2U8L3N0cm9uZz4gaW4gPC9zcGFuPiBDTzxzdWI+Mjwvc3ViPiBlbWlzc2lvbnMgb2YgYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfQ08yXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fQ08yX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHQgIFx0XHRcdDxkaXYgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcIkNPMl9DSEFOR0VfQ0xBU1NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zIFxcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfQ08yXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBDTzxzdWI+Mjwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPkNPPHN1Yj4yPC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJjbzJFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTExMCwxMTEyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiTk9fTk9YX0NIQU5HRVwiLGMscCwxKSxjLHAsMCwxMzI4LDE1MDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICBcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDxkaXYgY2xhc3M9XFxcIm5vX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHQ8c3Ryb25nPk5vIGNoYW5nZTwvc3Ryb25nPiBpbiA8L3NwYW4+IE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfTk9YXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fTk9YX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJOT1hfQ0hBTkdFX0NMQVNTXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfTk9YXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPk5PPHN1Yj54PC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDE4NDIsMTg0NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiT1JJR19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIk5PX1BNMTBfQ0hBTkdFXCIsYyxwLDEpLGMscCwwLDIwNjEsMjIzMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHRcdFx0XHQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPGRpdiBjbGFzcz1cXFwibm9fY2hhbmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdDxzdHJvbmc+Tm8gY2hhbmdlPC9zdHJvbmc+IGluIDwvc3Bhbj4gUE08c3ViPjEwPC9zdWI+IGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfUE0xMFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19QTTEwX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJQTTEwX0NIQU5HRV9DTEFTU1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnNcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1BNMTBcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfUE0xMFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyNTc4LDI1ODAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHRcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiT1JJR19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiXHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJwcm9wb3NhbE92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDE4LDQzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDxoND5BdHRyaWJ1dGVzIGZvciBcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwyNzgsMzg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdCAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNab25lc1wiLGMscCwxKSxjLHAsMCw0NjksNzE4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lIFNpemVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiem9uZXNcIixjLHAsMSksYyxwLDAsNTQxLDcwMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIHNlbGVjdGVkIHByb3Bvc2FsIGNvbnRhaW5zIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0NfSURcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc2tldGNoZXMgdGhhdCB0b3RhbCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNJWkVfU1FNSVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBzcXVhcmUgbWlsZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NoaXBwaW5nTGFuZXNcIixjLHAsMSksYyxwLDAsNzUzLDk5NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2UgcmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2hpcHBpbmcgTGFuZSBMZW5ndGhzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibGVuZ3Roc1wiLGMscCwxKSxjLHAsMCw4MzgsOTc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgcHJvcG9zZWQgc2hpcHBpbmcgbGFuZSA8c3Ryb25nPidcIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiJzwvc3Ryb25nPiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19MRU5HVEhcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbWlsZXMgbG9uZy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31yZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJzaGlwcGluZ0xhbmVSZXBvcnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImludGVyc2VjdHNSaWdcIixjLHAsMSksYyxwLDAsMTgsMjk0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIG9pbFJpZyB3YXJuaW5nIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PaWwgUGxhdGZvcm0gSW50ZXJzZWN0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBZb3VyIHByb3Bvc2FsIG92ZXJsYXBzIHRoZSBzYWZldHkgYXJlYSBhcm91bmQgYW4gb2lsIHBsYXRmb3JtIVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyYjQ1NWM5NjAwM2RjMTMwMTNlODRcXFwiPnNob3cgcGxhdGZvcm1zPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiIGNvbGxhcHNlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2hhbGUgU2lnaHRpbmdzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk51bWJlciBvZiB3aGFsZSBzaWdodGluZ3Mgd2l0aGluIHRoaXMgZm9vdHByaW50IGNvbXBhcmVkIHRvIGV4aXN0aW5nIHNoaXBwaW5nIGxhbmVzLiBTaWdodGluZ3MgYXJlIHJlY29yZGVkIGJ5IHdoYWxld2F0Y2hpbmcgdmVzc2Vscy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIndoYWxlU2lnaHRpbmdzXCIsYyxwLDEpLGMscCwwLDYwMSw3ODAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJkaWZmIFwiKTtfLmIoXy52KF8uZihcImNoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJjb3VudFxcXCI+XCIpO18uYihfLnYoXy5mKFwiY291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+PC9saT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGNsYXNzPVxcXCJtb3JlUmVzdWx0c1xcXCIgaHJlZj1cXFwiI1xcXCI+bW9yZSByZXN1bHRzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmMmI0NTVjOTYwMDNkYzEzMDEzZTQ1XFxcIj5zaG93IHNpZ2h0aW5ncyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBuZXcgc2hpcHBpbmcgbGFuZSBoYXMgYSBsZW5ndGggb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbGVuZ3RoXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IG1pbGVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMTgwLDE1OTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHAgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBlYWNoIHllYXIgZm9yIGFsbCB0cmFuc2l0czwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImRpc3RhbmNlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgY2hhbmdlIGluIGxlbmd0aFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJmdWVsXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInRvbnNGdWVsQ2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiBmdWVsIGNvbnN1bXB0aW9uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImNvc3RcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+JFwiKTtfLmIoXy52KF8uZihcImNvc3RDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGluIHZveWFnZSBjb3N0c1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNpZ25pZmljYW50RGlzdGFuY2VDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj5ObyBzaWduaWZpY2FudCBkaWZmZXJlbmNlIGZyb20gZXhpc3RpbmcgY29uZmlndXJhdGlvbi48L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBoYWJpdGF0IFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZW5zaXRpdmUgQmx1ZSBXaGFsZSBIYWJpdGF0PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiaW50ZXJzZWN0ZWRJc29iYXRoTVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWV0ZXJzIG9mIHNlbnNpdGl2ZSBoYWJpdGF0IGRpc3R1cmJlZC48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNoYW5nZSBcIik7Xy5iKF8udihfLmYoXCJpc29iYXRoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcImlzb2JhdGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wid2hhbGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2xvZ2ljYWxseSBJbXBvcnRhbnQgQXJlYXMgKEJJQXMpXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0ZGNkMmVlOWQyZDliYTAzMmUzNWIwM1xcXCI+c2hvdyBCSUEgbGF5ZXJzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVG90YWwgbnVtYmVyIG9mIHNxLiBtaWxlcyBvZiBhcmVhIGlkZW50aWZpZWQgYXMgYmlvbG9naWNhbGx5IGltcG9ydGFudCBmb3IgZmVlZGluZyBvciBtaWdyYXRpbmcgZm9yIHBhcnQgb2YgdGhlIHllYXIgdGhhdCBvdmVybGFwIHdpdGggdGhlIGZvb3RwcmludCBvZiB0aGUgc2tldGNoZWQgcGxhbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzZW5zaXRpdmVXaGFsZXNcIixjLHAsMSksYyxwLDAsNDA2LDk3MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICA8cD48c3Ryb25nPkluIFwiKTtfLmIoXy52KF8uZihcIlNDX05BTUVcIixjLHAsMCkpKTtfLmIoXCJzOjwvc3Ryb25nPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkJsdWVcXFwiPkJsdWUgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPkJhbGFlbm9wdGVyYSBtdXNjdWx1czwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkJMVUVfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJHcmF5XFxcIj5HcmF5IHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5Fc2NocmljaHRpdXMgcm9idXN0dXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJHUkFZX1NRTVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICA8bGkgY2xhc3M9XFxcIkh1bXBiYWNrXFxcIj5IdW1wYmFjayB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+TWVnYXB0ZXJhIG5vdmFlYW5nbGlhZTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkhVTVBfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+ICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiIGNvbGxhcHNlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Q2hhbm5lbCBJc2xhbmRzIE5hdHVyYWxpc3QgQ29ycCBPYnNlcnZhdGlvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRvdGFsIG51bWJlciBvZiBvYnNlcnZhdGlvbnMgcmVjb3JkZWQgaW4gdGhlIGZvb3RwcmludCBvZiB0aGlzIHNrZXRjaGVkIHBsYW4gYnkgdGhlIENoYW5uZWwgSXNsYW5kcyBOYXR1cmFsaXN0IENvcnAgdXBvbiB3aGFsZSB3YXRjaGluZyB2ZXNzZWxzLiAgVmlldyB0aGUgZWZmb3J0IGxheWVyIHRvIGFzc2VzcyB3aGV0aGVyIHRoaXMgaXMgYW4gYXBwcm9wcmlhdGUgZGF0YSBzZXQgdG8gdXNlIHRvIGNvbXBhcmUgcGxhbnMgb2YgaW50ZXJlc3QuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc01hbmFnZW1lbnRBcmVhc1wiLGMscCwxKSxjLHAsMCwxNDI1LDE4NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8cD48c3Ryb25nPkluIE1hbmFnZW1lbnQgQXJlYXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1nbXRfYXJlYV93aGFsZXNcIixjLHAsMSksYyxwLDAsMTUyOSwxODM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcImNvdW50X3RvdFwiLGMscCwwKSkpO18uYihcIiAoXCIpO18uYihfLnYoXy5mKFwiY291bnRfcGVyY1wiLGMscCwwKSkpO18uYihcIiUpPC9zcGFuPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDAsMTc0NSwxODA5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzU2hpcHBpbmdMYW5lc1wiLGMscCwxKSxjLHAsMCwxOTI4LDI0MDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPjxzdHJvbmc+SW4gU2hpcHBpbmcgTGFuZXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2hpcHBpbmdfbGFuZV93aGFsZXNcIixjLHAsMSksYyxwLDAsMjAzOCwyMzYzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxsaSBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+XCIpO18uYihfLnYoXy5mKFwic2NpZW50aWZpY05hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc19uYVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJjb3VudF90b3RcIixjLHAsMCkpKTtfLmIoXCIgKFwiKTtfLmIoXy52KF8uZihcImNvdW50X3BlcmNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwwLDIyNjQsMjMzMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzT3RoZXJXaGFsZXNcIixjLHAsMSksYyxwLDAsMjQ1MCwyOTA3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHA+PHN0cm9uZz5JbiBPdGhlciBTa2V0Y2ggVHlwZXM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm90aGVyV2hhbGVTaWdodGluZ3NcIixjLHAsMSksYyxwLDAsMjU1OSwyODY4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcImNvdW50X3RvdFwiLGMscCwwKSkpO18uYihcIiAoXCIpO18uYihfLnYoXy5mKFwiY291bnRfcGVyY1wiLGMscCwwKSkpO18uYihcIiUpPC9zcGFuPlwiKTtfLmIoXCJcXG5cIik7fTtpZihfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDAsMjc3NSwyODM5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcIm5hX2FyZWFcXFwiPk4vQTxzdXA+Kjwvc3VwPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTU0MWE5YWJjZGFjNGNhYTAyNWEzYmE4XFxcIj5zaG93IGVmZm9ydCBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNOQXNcIixjLHAsMSksYyxwLDAsMzA0MiwzMzI3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgc3R5bGU9XFxcIm1hcmdpbi10b3A6MzBweDtcXFwiPjxzdXA+Kjwvc3VwPjxpPldoYWxlIHNpZ2h0aW5nIGNvdW50cyBhcmUgb25seSBhcHBsaWNhYmxlIHdpdGhpbiB0aGUgQ2hhbm5lbCBJc2xhbmQgTmF0dXJhbGlzdCBDb3JwIE9ic2VydmF0aW9uIGFyZWEuIElmIGF0IGxlYXN0IDUwJSBvZiBhIG1hbmFnZW1lbnQgYXJlYSBvciBzaGlwcGluZyBsYW5lIGxpZXMgb3V0c2lkZSB0aGlzIHJlZ2lvbiwgdGhlIGNvdW50IHZhbHVlcyB3aWxsIGJlIG1hcmtlZCBhcyBOL0EuPC9pPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XaGFsZSBEZW5zaXR5IEhhYml0YXQgTW9kZWxzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1MjNmYTc5YjQzYTNhZDQyODQ0ZGE2MFxcXCI+c2hvdyB3aGFsZSBkZW5zaXR5IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhpcyBhbmFseXRpYyBjYWxjdWxhdGVzIHRoZSBzcS4gbWlsZXMgb2Ygb3ZlcmxhcCB3aXRoIGFyZWFzIG9mIHRvcCAyMCUgZGVuc2l0eSB2YWx1ZSBhY2NvcmRpbmcgdG8gdGhlIFJlZGZlcm4gZXQuIGFsLiB3aGFsZSBkZW5zaXR5IGhhYml0YXQgbW9kZWxzLiAgQSBncmVhdGVyIG51bWJlciBvZiBzcS4gbWlsZXMgY2FuIGJlIGludGVycHJldGVkIGFzIGEgZ3JlYXRlciBvdmVybGFwIHdpdGggaGlnaGVyIGRlbnNpdHkgYXJlYXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwicmVkZmVybl93aGFsZXNcIixjLHAsMSksYyxwLDAsMzgyOSw0MzkxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwPjxzdHJvbmc+SW4gXCIpO18uYihfLnYoXy5mKFwiU0NfTkFNRVwiLGMscCwwKSkpO18uYihcInM6PC9zdHJvbmc+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxsaSBjbGFzcz1cXFwiQmx1ZVxcXCI+Qmx1ZSB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+QmFsYWVub3B0ZXJhIG11c2N1bHVzPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPjxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiQkxVRV9TUU1cIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkZpblxcXCI+RmluIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5CYWxhZW5vcHRlcmEgcGh5c2FsdXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJGSU5fU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgIDxsaSBjbGFzcz1cXFwiSHVtcGJhY2tcXFwiPkh1bXBiYWNrIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5NZWdhcHRlcmEgbm92YWVhbmdsaWFlPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPjxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiSFVNUF9TUU1cIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT4gIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk92ZXJsYXAgd2l0aCBCbHVlIFdoYWxlIEhvbWUgUmFuZ2VcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTUzN2ZkNmE4YzViNDNlYjBmYWQyYzA3XFxcIj5zaG93IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgT3ZlcmxhcCB3aXRoIGRlbnNpdHkgbW9kZWxzIGRldmVsb3BlZCBmcm9tIEFSR09TIHNhdGVsbGl0ZSB0cmFja3MuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibGFkZF93aGFsZXNcIixjLHAsMSksYyxwLDAsNDcxMCw0ODM0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcImxhcmdlXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNDX05BTUVcIixjLHAsMCkpKTtfLmIoXCJzPC9zdHJvbmc+IG92ZXJsYXAgd2l0aCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IGNvcmUgYXJlYXMgb2YgYmx1ZSB3aGFsZSB1c2UuXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiem9uZU92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDE4LDQzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDxoND5BdHRyaWJ1dGVzIGZvciBcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwyNzgsMzg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdCAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2UgcmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+VGhlIHNlbGVjdGVkIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDU2MCw1OTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInByb3Bvc2FsIGNvbnRhaW5zIHpvbmVzIHRoYXQgYXJlIFwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiB6b25lIGlzIFwiKTt9O18uYihcIiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInpvbmVzaXplXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IHNxdWFyZSBtaWxlcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
