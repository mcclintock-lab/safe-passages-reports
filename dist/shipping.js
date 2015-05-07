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
var EmissionsTab, ReportTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
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

EmissionsTab = (function(_super) {
  __extends(EmissionsTab, _super);

  function EmissionsTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    _ref = EmissionsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EmissionsTab.prototype.name = 'Emissions';

  EmissionsTab.prototype.className = 'emissions';

  EmissionsTab.prototype.template = templates.emissions;

  EmissionsTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  EmissionsTab.prototype.dependencies = ['ShippingLaneReport', 'Emissions'];

  EmissionsTab.prototype.render = function() {
    var co2EmissionsChangeClass, co2EmissionsIncreased, co2EmissionsPercentChange, context, existingLength, length, new_co2_emissions, new_length, new_nox_emissions, new_pm_emissions, noxEmissionsChangeClass, noxEmissionsIncreased, noxEmissionsPercentChange, orig_co2_emissions, orig_nox_emissions, orig_pm_emissions, pmEmissionsChangeClass, pmEmissionsIncreased, pmEmissionsPercentChange, significantCO2EmissionsChange, significantNOXEmissionsChange, significantPMEmissionsChange;
    window.results = this.results;
    new_length = Math.round(this.recordSet('ShippingLaneReport', 'NewLength').data.value, 1);
    existingLength = 158.35;
    length = new_length;
    new_co2_emissions = parseFloat(this.recordSet('Emissions', 'NewCO2').data.value);
    orig_co2_emissions = parseFloat(this.recordSet('Emissions', 'OrigCO2').data.value);
    co2EmissionsIncreased = orig_co2_emissions - new_co2_emissions < 0;
    co2EmissionsChangeClass = co2EmissionsIncreased ? 'positive' : 'negative';
    co2EmissionsPercentChange = Math.abs(((orig_co2_emissions - new_co2_emissions) / new_co2_emissions) * 100);
    if (Math.abs(orig_co2_emissions - new_co2_emissions) < 0.01) {
      co2EmissionsChangeClass = 'nochange';
    }
    significantCO2EmissionsChange = Math.abs(orig_co2_emissions - new_co2_emissions) > 0.1;
    new_nox_emissions = parseFloat(this.recordSet('Emissions', 'NewNOX').data.value);
    orig_nox_emissions = parseFloat(this.recordSet('Emissions', 'OrigNOX').data.value);
    noxEmissionsIncreased = orig_nox_emissions - new_nox_emissions < 0;
    noxEmissionsChangeClass = noxEmissionsIncreased ? 'positive' : 'negative';
    noxEmissionsPercentChange = Math.abs(((orig_nox_emissions - new_nox_emissions) / new_nox_emissions) * 100);
    if (Math.abs(orig_nox_emissions - new_nox_emissions) < 0.01) {
      noxEmissionsChangeClass = 'nochange';
    }
    significantNOXEmissionsChange = Math.abs(orig_nox_emissions - new_nox_emissions) > 0.1;
    new_pm_emissions = parseFloat(this.recordSet('Emissions', 'NewPM').data.value);
    orig_pm_emissions = parseFloat(this.recordSet('Emissions', 'OrigPM').data.value);
    pmEmissionsIncreased = orig_pm_emissions - new_pm_emissions < 0;
    pmEmissionsChangeClass = pmEmissionsIncreased ? 'positive' : 'negative';
    pmEmissionsPercentChange = Math.abs(((orig_pm_emissions - new_pm_emissions) / new_pm_emissions) * 100);
    if (Math.abs(orig_pm_emissions - new_pm_emissions) < 0.01) {
      pmEmissionsChangeClass = 'nochange';
    }
    significantPMEmissionsChange = Math.abs(orig_pm_emissions - new_pm_emissions) > 0.1;
    context = {
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      new_length: new_length,
      significantCO2EmissionsChange: significantCO2EmissionsChange,
      new_co2_emissions: new_co2_emissions.toFixed(2),
      orig_co2_emissions: orig_co2_emissions.toFixed(2),
      co2EmissionsIncreased: co2EmissionsIncreased,
      co2EmissionsChangeClass: co2EmissionsChangeClass,
      co2EmissionsPercentChange: Math.round(co2EmissionsPercentChange),
      significantNOXEmissionsChange: significantNOXEmissionsChange,
      new_nox_emissions: new_nox_emissions.toFixed(3),
      orig_nox_emissions: orig_nox_emissions.toFixed(3),
      noxEmissionsIncreased: noxEmissionsIncreased,
      noxEmissionsChangeClass: noxEmissionsChangeClass,
      noxEmissionsPercentChange: Math.round(noxEmissionsPercentChange),
      significantPMEmissionsChange: significantPMEmissionsChange,
      new_pm_emissions: new_pm_emissions.toFixed(3),
      orig_pm_emissions: orig_pm_emissions.toFixed(3),
      pmEmissionsIncreased: pmEmissionsIncreased,
      pmEmissionsChangeClass: pmEmissionsChangeClass,
      pmEmissionsPercentChange: Math.round(pmEmissionsPercentChange)
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  EmissionsTab.prototype._handleReportLayerClick = function(e) {
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

  EmissionsTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return EmissionsTab;

})(ReportTab);

module.exports = EmissionsTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],12:[function(require,module,exports){
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
    var context, existingLength, isCollection, length, lengthChange, lengthChangeClass, lengthIncreased, overlapsRig, percentChange, rig, rigIntersections, rigs, _i, _len, _ref1;
    window.results = this.results;
    isCollection = this.model.isCollection();
    existingLength = 158.35;
    length = Math.round(this.recordSet('ShippingLaneReport', 'NewLength').data.value, 1);
    console.log("new length: ", length);
    percentChange = Math.abs(((existingLength - length) / length) * 100);
    lengthIncreased = existingLength - length < 0;
    lengthChange = Math.round(Math.abs(existingLength - length));
    lengthChangeClass = lengthIncreased ? 'positive' : 'negative';
    if (Math.abs(existingLength - length) < 0.01) {
      lengthChangeClass = 'nochange';
    }
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var EmissionsTab, OverviewTab, WhalesTab;

OverviewTab = require('./overviewTab.coffee');

WhalesTab = require('./whalesTab.coffee');

EmissionsTab = require('./emissionsTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, WhalesTab, EmissionsTab]);
  return report.stylesheets(['./report.css']);
});


},{"./emissionsTab.coffee":11,"./overviewTab.coffee":12,"./whalesTab.coffee":15}],14:[function(require,module,exports){
module.exports = [
  {
    id: 'Blue',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    unchangedCount: 118,
    count: 0
  }, {
    id: 'Humpback',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    unchangedCount: 176,
    count: 0
  }, {
    id: 'Gray',
    name: 'Gray Whale',
    scientificName: 'Eschrichtius robustus',
    unchangedCount: 33,
    count: 0
  }, {
    id: 'Fin',
    name: 'Fin Whale',
    scientificName: 'Balaenoptera physalus',
    unchangedCount: 7,
    count: 0
  }, {
    id: 'Minke',
    name: 'Minke Whale',
    scientificName: 'Balaenoptera acutorostrata',
    unchangedCount: 21,
    count: 0
  }, {
    id: 'Pilot Whale',
    name: 'Pilot Whale',
    scientificName: 'Globicephala macrorhynchus',
    unchangedCount: 0,
    count: 0
  }
];


},{}],15:[function(require,module,exports){
var ReportTab, WhalesTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  WhalesTab.prototype.dependencies = ['ShippingLaneReport'];

  WhalesTab.prototype.render = function() {
    var area, context, existingIsobathIntersection, existingLength, feature, intersectedIsobathM, isobath, isobathChange, isobathChangeClass, isobathPercentChange, length, record, sigDistanceChange, sightings, sightingsData, species, whaleSightings, _i, _j, _k, _len, _len1, _len2, _ref1;
    window.results = this.results;
    isobath = this.recordSet('ShippingLaneReport', 'Habitats');
    whaleSightings = this.recordSet('ShippingLaneReport', 'WhaleCount').toArray();
    length = Math.round(this.recordSet('ShippingLaneReport', 'NewLength').data.value, 1);
    sightings = {};
    for (_i = 0, _len = whaleSightings.length; _i < _len; _i++) {
      feature = whaleSightings[_i];
      species = feature.Species;
      if (__indexOf.call(_.keys(sightings), species) < 0) {
        sightings[feature.Species] = 0;
      }
      sightings[species] = sightings[species] + feature.FREQUENCY;
    }
    sightingsData = _.map(sightingsTemplate, function(s) {
      return _.clone(s);
    });
    console.log(".......sightings: ", sightingsData);
    for (_j = 0, _len1 = sightingsData.length; _j < _len1; _j++) {
      record = sightingsData[_j];
      if (sightings[record.id]) {
        record.count = sightings[record.id];
      }
      record.diff = record.count - record.unchangedCount;
      record.percentChange = Math.round((Math.abs(record.diff) / record.unchangedCount) * 100);
      if (record.percentChange === Infinity) {
        record.percentChange = '>100';
      }
      record.changeClass = record.diff > 0 ? 'positive' : 'negative';
      if (_.isNaN(record.percentChange)) {
        record.percentChange = 0;
        record.changeClass = 'nochange';
      }
    }
    area = 0;
    _ref1 = isobath.toArray();
    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
      feature = _ref1[_k];
      area = area + feature.Shape_Area;
    }
    intersectedIsobathM = area / 1000;
    existingIsobathIntersection = 39264;
    isobathChange = intersectedIsobathM - existingIsobathIntersection;
    isobathChangeClass = isobathChange > 0 ? 'positive' : 'negative';
    isobathPercentChange = Math.round((Math.abs(isobathChange) / existingIsobathIntersection) * 100);
    existingLength = 158;
    sigDistanceChange = Math.abs(existingLength - length) > 0.1;
    context = {
      significantDistanceChange: sigDistanceChange,
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      whaleSightings: sightingsData,
      intersectedIsobathM: addCommas(Math.round(intersectedIsobathM)),
      isobathPercentChange: isobathPercentChange,
      isobathChangeClass: isobathChangeClass
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["emissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!--");_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,128,546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("co2EmissionsPercentChange",c,p,0)));_.b("</span>  emissions</p>");_.b("\n" + i);_.b("    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_co2_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1097,1099,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_co2_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1438,1440,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,1778,1780,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes. Estimates assume a vessel speed of 16 knots.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("noxEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>NO<sub>x</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("noxEmissionsPercentChange",c,p,0)));_.b("</span> tons NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, NO<sub>x</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,2526,2528,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("pmEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>PM<sub>10</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("pmEmissionsPercentChange",c,p,0)));_.b("</span> tons PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, PM<sub>10</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,3226,3228,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"distance reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Length</h4>");_.b("\n" + i);_.b("  	<p class=\"lane_length\"><span class=\"measure\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("	<div class=\"length_diff\">");_.b("\n" + i);_.b("		The new shipping lane is <strong>");_.b(_.v(_.f("length",c,p,0)));_.b("</strong> nautical miles, <strong>");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</strong> nautical miles");_.b("\n" + i);_.b("		");if(_.s(_.f("lengthIncreased",c,p,1),c,p,0,319,325,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("longer");});c.pop();}if(!_.s(_.f("lengthIncreased",c,p,1),c,p,1,0,0,"")){_.b("shorter");};_.b(" than the original shipping lane.");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("intersectsRig",c,p,1),c,p,0,460,736,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"54ac50fd0e7f86cf7909abd2\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n");return _.fl();;});
this["Templates"]["proposalEmissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);_.b("  	<div style=\"font-style:italic;\">");_.b("\n" + i);_.b("  		The following estimates are the result of changes in emissions based on changes to the shipping lane length and the introduction of Speed Reduction Zones:");_.b("\n" + i);_.b("  	</div>");_.b("\n" + i);if(_.s(_.f("emissionsReductions",c,p,1),c,p,0,321,2863,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  		<div class=\"in-report-header\">For shipping lane <div class=\"lane-name\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</div>, emission reductions are:</div>");_.b("\n" + i);_.b("	  		<div class=\"emissions-report\">");_.b("\n" + i);if(_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,0,505,704,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> CO<sub>2</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("		  			<div class=\"");_.b(_.v(_.f("CO2_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions \"><span class=\"measure\">");_.b(_.v(_.f("PERC_CO2",c,p,0)));_.b("</span> CO<sub>2</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1069,1071,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_CO2",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,0,1292,1492,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> NO<sub>x</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("				    </div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("NOX_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_NOX",c,p,0)));_.b("</span> NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1852,1854,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_NOX",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,0,2076,2273,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("				 ");_.b("\n" + i);_.b("				    <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> PM<sub>10</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("PM10_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_PM10",c,p,0)));_.b("</span> PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,2639,2641,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("				    	");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_PM10",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("			    	</div>");_.b("\n");};_.b("	    	</div>");_.b("\n");});c.pop();}_.b("	  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("\n" + i);_.b("  ");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["proposalOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Zone Sizes</h4>");_.b("\n" + i);if(_.s(_.f("zones",c,p,1),c,p,0,528,687,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The selected proposal contains <strong>");_.b(_.v(_.f("SC_ID",c,p,0)));_.b("</strong> sketches that total <strong>");_.b(_.v(_.f("SIZE_SQMI",c,p,0)));_.b("</strong> square miles.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Shipping Lane Lengths</h4>");_.b("\n" + i);if(_.s(_.f("lengths",c,p,1),c,p,0,790,928,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The proposed shipping lane <strong>'");_.b(_.v(_.f("NAME",c,p,0)));_.b("'</strong> is <strong>");_.b(_.v(_.f("NEW_LENGTH",c,p,0)));_.b("</strong> miles long.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["shippingLaneReport"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("intersectsRig",c,p,1),c,p,0,18,294,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f2b455c96003dc13013e84\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,601,780,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"diff ");_.b(_.v(_.f("changeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"51f2b455c96003dc13013e45\">show sightings layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);_.b("  <p>The new shipping lane has a length of <strong>");_.b(_.v(_.f("new_length",c,p,0)));_.b("</strong> miles.</p>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,1180,1598,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection habitat ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Sensitive Blue Whale Habitat</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("intersectedIsobathM",c,p,0)));_.b(" square meters of sensitive habitat disturbed.</span><span class=\"change ");_.b(_.v(_.f("isobathChangeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("isobathPercentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["whales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,287,466,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"diff ");_.b(_.v(_.f("changeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection habitat ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Sensitive Blue Whale Habitat</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("intersectedIsobathM",c,p,0)));_.b(" square meters of sensitive habitat disturbed.</span></br><span class=\"change ");_.b(_.v(_.f("isobathChangeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("isobathPercentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["zoneOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  	<p class=\"large\">The selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,560,593,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("proposal contains zones that are ");});c.pop();}_.b("\n" + i);_.b("  		");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" zone is ");};_.b(" <strong>");_.b(_.v(_.f("zonesize",c,p,0)));_.b("</strong> square miles.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneWhales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,112,232,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9lbWlzc2lvbnNUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9vdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3NoaXBwaW5nLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvc2lnaHRpbmdzVGVtcGxhdGUuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy93aGFsZXNUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FB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QUFBO0NBekRGLEVBUVE7O0NBUlIsRUE0RHlCLE1BQUMsY0FBMUI7Q0FDRSxPQUFBLENBQUE7Q0FBQSxHQUFBLFVBQUE7Q0FBQSxFQUNBLENBQUEsRUFBTTtDQUROLEVBRU8sQ0FBUCxFQUFhLEdBQTBDLEVBQVYsQ0FBdEMsR0FBMEI7O0NBQzNCLEdBQUYsRUFBSixLQUFBO01BSEE7O0NBSU0sR0FBRixFQUFKLGFBQUE7TUFKQTs7Q0FLTSxHQUFGLEVBQUosR0FBQTtNQUxBO0NBRHVCLFVBT3ZCO0NBbkVGLEVBNER5Qjs7Q0E1RHpCLEVBcUVvQixNQUFDLFNBQXJCOzs7Q0FDRyxPQUFEOztNQUFBO0NBQ0EsS0FBQSxDQUFBLElBQUEsS0FBQTtDQXZFRixFQXFFb0I7O0NBckVwQjs7Q0FEc0I7O0FBMEV4QixDQTVGQSxFQTRGaUIsR0FBWCxDQUFOLEVBNUZBOzs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjb25zb2xlLmxvZyBAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpXG4gICAgICAgICAgcGF5bG9hZFNpemUgPSBNYXRoLnJvdW5kKCgoQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKSBvciAwKSAvIDEwMjQpICogMTAwKSAvIDEwMFxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiRmVhdHVyZVNldCBzZW50IHRvIEdQIHdlaWdoZWQgaW4gYXQgI3twYXlsb2FkU2l6ZX1rYlwiXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChAbWF4RXRhICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7QG1heEV0YSArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YVNlY29uZHMnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnNpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgRW1pc3Npb25zVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbWlzc2lvbnMnXG4gIGNsYXNzTmFtZTogJ2VtaXNzaW9ucydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lbWlzc2lvbnNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbJ1NoaXBwaW5nTGFuZVJlcG9ydCcsICdFbWlzc2lvbnMnXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG5cbiAgICBuZXdfbGVuZ3RoID0gTWF0aC5yb3VuZChAcmVjb3JkU2V0KCdTaGlwcGluZ0xhbmVSZXBvcnQnLCAnTmV3TGVuZ3RoJykuZGF0YS52YWx1ZSwxKVxuICAgIGV4aXN0aW5nTGVuZ3RoID0gMTU4LjM1XG4gICAgbGVuZ3RoID0gbmV3X2xlbmd0aFxuXG5cbiAgICBuZXdfY28yX2VtaXNzaW9ucyA9IHBhcnNlRmxvYXQoQHJlY29yZFNldCgnRW1pc3Npb25zJywgJ05ld0NPMicpLmRhdGEudmFsdWUpXG4gICAgb3JpZ19jbzJfZW1pc3Npb25zID0gcGFyc2VGbG9hdChAcmVjb3JkU2V0KCdFbWlzc2lvbnMnLCAnT3JpZ0NPMicpLmRhdGEudmFsdWUpXG5cbiAgICBjbzJFbWlzc2lvbnNJbmNyZWFzZWQgPSBvcmlnX2NvMl9lbWlzc2lvbnMgLSBuZXdfY28yX2VtaXNzaW9ucyA8IDBcbiAgICBjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzcyA9IGlmIGNvMkVtaXNzaW9uc0luY3JlYXNlZCB0aGVuICdwb3NpdGl2ZScgZWxzZSAnbmVnYXRpdmUnXG4gICAgY28yRW1pc3Npb25zUGVyY2VudENoYW5nZSA9ICBNYXRoLmFicygoKG9yaWdfY28yX2VtaXNzaW9ucyAtIG5ld19jbzJfZW1pc3Npb25zKSAvIG5ld19jbzJfZW1pc3Npb25zKSAqIDEwMClcbiAgICBcbiAgICBpZiBNYXRoLmFicyhvcmlnX2NvMl9lbWlzc2lvbnMgLSBuZXdfY28yX2VtaXNzaW9ucykgPCAwLjAxXG4gICAgICBjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzcyA9ICdub2NoYW5nZSdcbiAgICBzaWduaWZpY2FudENPMkVtaXNzaW9uc0NoYW5nZSA9IE1hdGguYWJzKG9yaWdfY28yX2VtaXNzaW9ucyAtIG5ld19jbzJfZW1pc3Npb25zKSA+IDAuMVxuXG5cbiAgICBuZXdfbm94X2VtaXNzaW9ucyA9IHBhcnNlRmxvYXQoQHJlY29yZFNldCgnRW1pc3Npb25zJywgJ05ld05PWCcpLmRhdGEudmFsdWUpXG4gICAgb3JpZ19ub3hfZW1pc3Npb25zID0gcGFyc2VGbG9hdChAcmVjb3JkU2V0KCdFbWlzc2lvbnMnLCAnT3JpZ05PWCcpLmRhdGEudmFsdWUpXG5cbiAgICBub3hFbWlzc2lvbnNJbmNyZWFzZWQgPSBvcmlnX25veF9lbWlzc2lvbnMgLSBuZXdfbm94X2VtaXNzaW9ucyA8IDBcbiAgICBub3hFbWlzc2lvbnNDaGFuZ2VDbGFzcyA9IGlmIG5veEVtaXNzaW9uc0luY3JlYXNlZCB0aGVuICdwb3NpdGl2ZScgZWxzZSAnbmVnYXRpdmUnXG4gICAgbm94RW1pc3Npb25zUGVyY2VudENoYW5nZSA9ICBNYXRoLmFicygoKG9yaWdfbm94X2VtaXNzaW9ucyAtIG5ld19ub3hfZW1pc3Npb25zKSAvIG5ld19ub3hfZW1pc3Npb25zKSAqIDEwMClcbiAgICBpZiBNYXRoLmFicyhvcmlnX25veF9lbWlzc2lvbnMgLSBuZXdfbm94X2VtaXNzaW9ucykgPCAwLjAxXG4gICAgICBub3hFbWlzc2lvbnNDaGFuZ2VDbGFzcyA9ICdub2NoYW5nZSdcbiAgICBzaWduaWZpY2FudE5PWEVtaXNzaW9uc0NoYW5nZSA9IE1hdGguYWJzKG9yaWdfbm94X2VtaXNzaW9ucyAtIG5ld19ub3hfZW1pc3Npb25zKSA+IDAuMVxuXG5cbiAgICBuZXdfcG1fZW1pc3Npb25zID0gcGFyc2VGbG9hdChAcmVjb3JkU2V0KCdFbWlzc2lvbnMnLCAnTmV3UE0nKS5kYXRhLnZhbHVlKVxuICAgIG9yaWdfcG1fZW1pc3Npb25zID0gcGFyc2VGbG9hdChAcmVjb3JkU2V0KCdFbWlzc2lvbnMnLCAnT3JpZ1BNJykuZGF0YS52YWx1ZSlcblxuICAgIHBtRW1pc3Npb25zSW5jcmVhc2VkID0gb3JpZ19wbV9lbWlzc2lvbnMgLSBuZXdfcG1fZW1pc3Npb25zIDwgMFxuICAgIHBtRW1pc3Npb25zQ2hhbmdlQ2xhc3MgPSBpZiBwbUVtaXNzaW9uc0luY3JlYXNlZCB0aGVuICdwb3NpdGl2ZScgZWxzZSAnbmVnYXRpdmUnXG4gICAgcG1FbWlzc2lvbnNQZXJjZW50Q2hhbmdlID0gIE1hdGguYWJzKCgob3JpZ19wbV9lbWlzc2lvbnMgLSBuZXdfcG1fZW1pc3Npb25zKSAvIG5ld19wbV9lbWlzc2lvbnMpICogMTAwKVxuXG4gICAgaWYgTWF0aC5hYnMob3JpZ19wbV9lbWlzc2lvbnMgLSBuZXdfcG1fZW1pc3Npb25zKSA8IDAuMDFcbiAgICAgIHBtRW1pc3Npb25zQ2hhbmdlQ2xhc3MgPSAnbm9jaGFuZ2UnXG4gICAgc2lnbmlmaWNhbnRQTUVtaXNzaW9uc0NoYW5nZSA9IE1hdGguYWJzKG9yaWdfcG1fZW1pc3Npb25zIC0gbmV3X3BtX2VtaXNzaW9ucykgPiAwLjFcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoQ2xhc3M6IEBhcHAuc2tldGNoQ2xhc3Nlcy5nZXQoQG1vZGVsLmdldCAnc2tldGNoY2xhc3MnKS5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBuZXdfbGVuZ3RoOiBuZXdfbGVuZ3RoXG5cbiAgICAgIHNpZ25pZmljYW50Q08yRW1pc3Npb25zQ2hhbmdlOiBzaWduaWZpY2FudENPMkVtaXNzaW9uc0NoYW5nZVxuXG4gICAgICBuZXdfY28yX2VtaXNzaW9uczogbmV3X2NvMl9lbWlzc2lvbnMudG9GaXhlZCgyKVxuICAgICAgb3JpZ19jbzJfZW1pc3Npb25zOiBvcmlnX2NvMl9lbWlzc2lvbnMudG9GaXhlZCgyKVxuXG4gICAgICBjbzJFbWlzc2lvbnNJbmNyZWFzZWQ6IGNvMkVtaXNzaW9uc0luY3JlYXNlZFxuICAgICAgY28yRW1pc3Npb25zQ2hhbmdlQ2xhc3M6IGNvMkVtaXNzaW9uc0NoYW5nZUNsYXNzXG4gICAgICBjbzJFbWlzc2lvbnNQZXJjZW50Q2hhbmdlOiBNYXRoLnJvdW5kKGNvMkVtaXNzaW9uc1BlcmNlbnRDaGFuZ2UpXG5cbiAgICAgIHNpZ25pZmljYW50Tk9YRW1pc3Npb25zQ2hhbmdlOiBzaWduaWZpY2FudE5PWEVtaXNzaW9uc0NoYW5nZVxuXG4gICAgICBuZXdfbm94X2VtaXNzaW9uczogbmV3X25veF9lbWlzc2lvbnMudG9GaXhlZCgzKVxuICAgICAgb3JpZ19ub3hfZW1pc3Npb25zOiBvcmlnX25veF9lbWlzc2lvbnMudG9GaXhlZCgzKVxuXG4gICAgICBub3hFbWlzc2lvbnNJbmNyZWFzZWQ6IG5veEVtaXNzaW9uc0luY3JlYXNlZFxuICAgICAgbm94RW1pc3Npb25zQ2hhbmdlQ2xhc3M6IG5veEVtaXNzaW9uc0NoYW5nZUNsYXNzXG4gICAgICBub3hFbWlzc2lvbnNQZXJjZW50Q2hhbmdlOiBNYXRoLnJvdW5kKG5veEVtaXNzaW9uc1BlcmNlbnRDaGFuZ2UpXG5cbiAgICAgIHNpZ25pZmljYW50UE1FbWlzc2lvbnNDaGFuZ2U6IHNpZ25pZmljYW50UE1FbWlzc2lvbnNDaGFuZ2VcblxuICAgICAgbmV3X3BtX2VtaXNzaW9uczogbmV3X3BtX2VtaXNzaW9ucy50b0ZpeGVkKDMpXG4gICAgICBvcmlnX3BtX2VtaXNzaW9uczogb3JpZ19wbV9lbWlzc2lvbnMudG9GaXhlZCgzKVxuXG4gICAgICBwbUVtaXNzaW9uc0luY3JlYXNlZDogcG1FbWlzc2lvbnNJbmNyZWFzZWRcbiAgICAgIHBtRW1pc3Npb25zQ2hhbmdlQ2xhc3M6IHBtRW1pc3Npb25zQ2hhbmdlQ2xhc3NcbiAgICAgIHBtRW1pc3Npb25zUGVyY2VudENoYW5nZTogTWF0aC5yb3VuZChwbUVtaXNzaW9uc1BlcmNlbnRDaGFuZ2UpXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlciBjb250ZXh0LCBAcGFydGlhbHNcblxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgICAjIFNob3VsZG4ndCB3ZSBnaXZlIHNvbWUgZmVlZGJhY2sgdG8gdGhlIHVzZXIgaWYgdGhlIGxheWVyIGlzbid0IHByZXNlbnQgaW4gdGhlIGxheWVyIHRyZWU/XG4gIF9oYW5kbGVSZXBvcnRMYXllckNsaWNrOiAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB1cmwgPSAkKGUudGFyZ2V0KS5hdHRyKCdocmVmJylcbiAgICBub2RlID0gd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UuZGF0YVNpZGViYXIubGF5ZXJUcmVlLmdldE5vZGVCeVVybCB1cmxcbiAgICBub2RlPy5tYWtlVmlzaWJsZSgpXG4gICAgbm9kZT8ubWFrZUFsbFZpc2libGVCZWxvdygpXG4gICAgbm9kZT8udXBkYXRlTWFwKClcbiAgICBmYWxzZVxuXG4gIG9uTW9yZVJlc3VsdHNDbGljazogKGUpID0+XG4gICAgZT8ucHJldmVudERlZmF1bHQ/KClcbiAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcucmVwb3J0U2VjdGlvbicpLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gRW1pc3Npb25zVGFiIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnNpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBldmVudHM6XG4gICAgXCJjbGljayBhW3JlbD10b2dnbGUtbGF5ZXJdXCIgOiAnX2hhbmRsZVJlcG9ydExheWVyQ2xpY2snXG4gICAgXCJjbGljayBhLm1vcmVSZXN1bHRzXCI6ICAgICAgICAnb25Nb3JlUmVzdWx0c0NsaWNrJ1xuICBkZXBlbmRlbmNpZXM6IFsnU2hpcHBpbmdMYW5lUmVwb3J0J11cblxuICByZW5kZXI6ICgpIC0+XG4gICAgd2luZG93LnJlc3VsdHMgPSBAcmVzdWx0c1xuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgIGV4aXN0aW5nTGVuZ3RoID0gMTU4LjM1XG4gICAgbGVuZ3RoID0gTWF0aC5yb3VuZChAcmVjb3JkU2V0KCdTaGlwcGluZ0xhbmVSZXBvcnQnLCAnTmV3TGVuZ3RoJykuZGF0YS52YWx1ZSwxKVxuICAgIGNvbnNvbGUubG9nKFwibmV3IGxlbmd0aDogXCIsIGxlbmd0aClcbiAgICAjbGVuZ3RoID0gQG1vZGVsLmdldCgnZ2VvbWV0cnknKS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzLlNoYXBlX0xlbmd0aCAvIDUwNDhcbiAgICBwZXJjZW50Q2hhbmdlID0gTWF0aC5hYnMoKChleGlzdGluZ0xlbmd0aCAtIGxlbmd0aCkgLyBsZW5ndGgpICogMTAwKVxuICAgIGxlbmd0aEluY3JlYXNlZCA9IGV4aXN0aW5nTGVuZ3RoIC0gbGVuZ3RoIDwgMFxuICAgIGxlbmd0aENoYW5nZSA9IE1hdGgucm91bmQoTWF0aC5hYnMoZXhpc3RpbmdMZW5ndGgtbGVuZ3RoKSlcbiAgICBsZW5ndGhDaGFuZ2VDbGFzcyA9IGlmIGxlbmd0aEluY3JlYXNlZCB0aGVuICdwb3NpdGl2ZScgZWxzZSAnbmVnYXRpdmUnXG4gICAgaWYgTWF0aC5hYnMoZXhpc3RpbmdMZW5ndGggLSBsZW5ndGgpIDwgMC4wMVxuICAgICAgbGVuZ3RoQ2hhbmdlQ2xhc3MgPSAnbm9jaGFuZ2UnXG5cbiAgICByaWdzID0gQHJlY29yZFNldCgnU2hpcHBpbmdMYW5lUmVwb3J0JywgJ1JpZ3NOZWFyJylcbiAgICByaWdJbnRlcnNlY3Rpb25zID0gMFxuICAgIGZvciByaWcgaW4gcmlncy50b0FycmF5KClcbiAgICAgIGlmIHJpZy5ORUFSX0RJU1QgPCA1MDBcbiAgICAgICAgcmlnSW50ZXJzZWN0aW9ucyA9IHJpZ0ludGVyc2VjdGlvbnMgKyAxXG4gICAgb3ZlcmxhcHNSaWcgPSByaWdJbnRlcnNlY3Rpb25zID4gMFxuXG4gICAgY29udGV4dCA9XG4gICAgICBpbnRlcnNlY3RzUmlnOiBvdmVybGFwc1JpZ1xuICAgICAgbGVuZ3RoOiBsZW5ndGggXG4gICAgICBleGlzdGluZ0xlbmd0aDogTWF0aC5yb3VuZChleGlzdGluZ0xlbmd0aClcbiAgICAgIGxlbmd0aENoYW5nZUNsYXNzOiBsZW5ndGhDaGFuZ2VDbGFzc1xuICAgICAgbGVuZ3RoSW5jcmVhc2VkOmxlbmd0aEluY3JlYXNlZFxuICAgICAgbGVuZ3RoQ2hhbmdlOmxlbmd0aENoYW5nZVxuICAgICAgcGVyY2VudENoYW5nZTogTWF0aC5yb3VuZChwZXJjZW50Q2hhbmdlKVxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIgY29udGV4dCwgQHBhcnRpYWxzXG5cbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gICAgIyBTaG91bGRuJ3Qgd2UgZ2l2ZSBzb21lIGZlZWRiYWNrIHRvIHRoZSB1c2VyIGlmIHRoZSBsYXllciBpc24ndCBwcmVzZW50IGluIHRoZSBsYXllciB0cmVlP1xuICBfaGFuZGxlUmVwb3J0TGF5ZXJDbGljazogKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdXJsID0gJChlLnRhcmdldCkuYXR0cignaHJlZicpXG4gICAgbm9kZSA9IHdpbmRvdy5hcHAucHJvamVjdGhvbWVwYWdlLmRhdGFTaWRlYmFyLmxheWVyVHJlZS5nZXROb2RlQnlVcmwgdXJsXG4gICAgbm9kZT8ubWFrZVZpc2libGUoKVxuICAgIG5vZGU/Lm1ha2VBbGxWaXNpYmxlQmVsb3coKVxuICAgIG5vZGU/LnVwZGF0ZU1hcCgpXG4gICAgZmFsc2VcblxuICBvbk1vcmVSZXN1bHRzQ2xpY2s6IChlKSA9PlxuICAgIGU/LnByZXZlbnREZWZhdWx0PygpXG4gICAgJChlLnRhcmdldCkuY2xvc2VzdCgnLnJlcG9ydFNlY3Rpb24nKS5yZW1vdmVDbGFzcyAnY29sbGFwc2VkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJ2aWV3VGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3VGFiLmNvZmZlZSdcbldoYWxlc1RhYiA9IHJlcXVpcmUgJy4vd2hhbGVzVGFiLmNvZmZlZSdcbkVtaXNzaW9uc1RhYiA9IHJlcXVpcmUgJy4vZW1pc3Npb25zVGFiLmNvZmZlZSdcbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiLCBXaGFsZXNUYWIsIEVtaXNzaW9uc1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICB7XG4gICAgaWQ6ICdCbHVlJ1xuICAgIG5hbWU6ICdCbHVlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIG11c2N1bHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAxMThcbiAgICBjb3VudDogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdIdW1wYmFjaydcbiAgICBuYW1lOiAnSHVtcGJhY2sgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdNZWdhcHRlcmEgbm92YWVhbmdsaWFlJ1xuICAgIHVuY2hhbmdlZENvdW50OiAxNzZcbiAgICBjb3VudDogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdHcmF5J1xuICAgIG5hbWU6ICdHcmF5IFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnRXNjaHJpY2h0aXVzIHJvYnVzdHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAzM1xuICAgIGNvdW50OiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ0ZpbidcbiAgICBuYW1lOiAnRmluIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIHBoeXNhbHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiA3XG4gICAgY291bnQ6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnTWlua2UnXG4gICAgbmFtZTogJ01pbmtlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIGFjdXRvcm9zdHJhdGEnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDIxXG4gICAgY291bnQ6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnUGlsb3QgV2hhbGUnXG4gICAgbmFtZTogJ1BpbG90IFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnR2xvYmljZXBoYWxhIG1hY3Jvcmh5bmNodXMnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDBcbiAgICBjb3VudDogMFxuICB9XG5dIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcbnNpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgV2hhbGVzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdXaGFsZXMnXG4gIGNsYXNzTmFtZTogJ3doYWxlcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy53aGFsZXNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbJ1NoaXBwaW5nTGFuZVJlcG9ydCddXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHdpbmRvdy5yZXN1bHRzID0gQHJlc3VsdHNcbiAgICBpc29iYXRoID0gQHJlY29yZFNldCgnU2hpcHBpbmdMYW5lUmVwb3J0JywgJ0hhYml0YXRzJylcbiAgICB3aGFsZVNpZ2h0aW5ncyA9IEByZWNvcmRTZXQoJ1NoaXBwaW5nTGFuZVJlcG9ydCcsICdXaGFsZUNvdW50JykudG9BcnJheSgpXG4gICAgbGVuZ3RoID0gTWF0aC5yb3VuZChAcmVjb3JkU2V0KCdTaGlwcGluZ0xhbmVSZXBvcnQnLCAnTmV3TGVuZ3RoJykuZGF0YS52YWx1ZSwxKVxuICAgIHNpZ2h0aW5ncyA9IHt9XG4gICAgZm9yIGZlYXR1cmUgaW4gd2hhbGVTaWdodGluZ3NcbiAgICAgIHNwZWNpZXMgPSBmZWF0dXJlLlNwZWNpZXNcbiAgICAgIHVubGVzcyBzcGVjaWVzIGluIF8ua2V5cyhzaWdodGluZ3MpXG4gICAgICAgIHNpZ2h0aW5nc1tmZWF0dXJlLlNwZWNpZXNdID0gMFxuICAgICAgc2lnaHRpbmdzW3NwZWNpZXNdID0gc2lnaHRpbmdzW3NwZWNpZXNdICsgZmVhdHVyZS5GUkVRVUVOQ1lcbiAgICBzaWdodGluZ3NEYXRhID0gXy5tYXAgc2lnaHRpbmdzVGVtcGxhdGUsIChzKSAtPiBfLmNsb25lKHMpXG4gICAgY29uc29sZS5sb2coXCIuLi4uLi4uc2lnaHRpbmdzOiBcIiwgc2lnaHRpbmdzRGF0YSlcbiAgICBmb3IgcmVjb3JkIGluIHNpZ2h0aW5nc0RhdGFcbiAgICAgIHJlY29yZC5jb3VudCA9IHNpZ2h0aW5nc1tyZWNvcmQuaWRdIGlmIHNpZ2h0aW5nc1tyZWNvcmQuaWRdXG4gICAgICByZWNvcmQuZGlmZiA9IHJlY29yZC5jb3VudCAtIHJlY29yZC51bmNoYW5nZWRDb3VudFxuICAgICAgcmVjb3JkLnBlcmNlbnRDaGFuZ2UgPSAgTWF0aC5yb3VuZCgoTWF0aC5hYnMocmVjb3JkLmRpZmYpL3JlY29yZC51bmNoYW5nZWRDb3VudCkgKiAxMDApXG4gICAgICBpZiByZWNvcmQucGVyY2VudENoYW5nZSBpcyBJbmZpbml0eSB0aGVuIHJlY29yZC5wZXJjZW50Q2hhbmdlID0gJz4xMDAnO1xuICAgICAgcmVjb3JkLmNoYW5nZUNsYXNzID0gaWYgcmVjb3JkLmRpZmYgPiAwIHRoZW4gJ3Bvc2l0aXZlJyBlbHNlICduZWdhdGl2ZSdcbiAgICAgIGlmIF8uaXNOYU4ocmVjb3JkLnBlcmNlbnRDaGFuZ2UpXG4gICAgICAgIHJlY29yZC5wZXJjZW50Q2hhbmdlID0gMFxuICAgICAgICByZWNvcmQuY2hhbmdlQ2xhc3MgPSAnbm9jaGFuZ2UnXG5cbiAgICBhcmVhID0gMFxuICAgIGZvciBmZWF0dXJlIGluIGlzb2JhdGgudG9BcnJheSgpXG4gICAgICBhcmVhID0gYXJlYSArIGZlYXR1cmUuU2hhcGVfQXJlYVxuXG4gICAgaW50ZXJzZWN0ZWRJc29iYXRoTSA9IGFyZWEgLyAxMDAwXG4gICAgZXhpc3RpbmdJc29iYXRoSW50ZXJzZWN0aW9uID0gMzkyNjRcbiAgICBpc29iYXRoQ2hhbmdlID0gaW50ZXJzZWN0ZWRJc29iYXRoTSAtIGV4aXN0aW5nSXNvYmF0aEludGVyc2VjdGlvblxuXG4gICAgaXNvYmF0aENoYW5nZUNsYXNzID0gaWYgaXNvYmF0aENoYW5nZSA+IDAgdGhlbiAncG9zaXRpdmUnIGVsc2UgJ25lZ2F0aXZlJ1xuICAgIGlzb2JhdGhQZXJjZW50Q2hhbmdlID0gTWF0aC5yb3VuZCgoTWF0aC5hYnMoaXNvYmF0aENoYW5nZSkgLyBleGlzdGluZ0lzb2JhdGhJbnRlcnNlY3Rpb24pICogMTAwKVxuICAgIGV4aXN0aW5nTGVuZ3RoID0gMTU4XG4gICAgc2lnRGlzdGFuY2VDaGFuZ2UgPSBNYXRoLmFicyhleGlzdGluZ0xlbmd0aCAtIGxlbmd0aCkgPiAwLjFcblxuICAgIGNvbnRleHQgPVxuICAgICAgc2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZTogc2lnRGlzdGFuY2VDaGFuZ2VcbiAgICAgIHNrZXRjaENsYXNzOiBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KEBtb2RlbC5nZXQgJ3NrZXRjaGNsYXNzJykuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuXG4gICAgICB3aGFsZVNpZ2h0aW5nczogc2lnaHRpbmdzRGF0YVxuICAgICAgaW50ZXJzZWN0ZWRJc29iYXRoTTogYWRkQ29tbWFzKE1hdGgucm91bmQoaW50ZXJzZWN0ZWRJc29iYXRoTSkpXG4gICAgICBpc29iYXRoUGVyY2VudENoYW5nZTogaXNvYmF0aFBlcmNlbnRDaGFuZ2VcbiAgICAgIGlzb2JhdGhDaGFuZ2VDbGFzczogaXNvYmF0aENoYW5nZUNsYXNzXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICAgICMgU2hvdWxkbid0IHdlIGdpdmUgc29tZSBmZWVkYmFjayB0byB0aGUgdXNlciBpZiB0aGUgbGF5ZXIgaXNuJ3QgcHJlc2VudCBpbiB0aGUgbGF5ZXIgdHJlZT9cbiAgX2hhbmRsZVJlcG9ydExheWVyQ2xpY2s6IChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHVybCA9ICQoZS50YXJnZXQpLmF0dHIoJ2hyZWYnKVxuICAgIG5vZGUgPSB3aW5kb3cuYXBwLnByb2plY3Rob21lcGFnZS5kYXRhU2lkZWJhci5sYXllclRyZWUuZ2V0Tm9kZUJ5VXJsIHVybFxuICAgIG5vZGU/Lm1ha2VWaXNpYmxlKClcbiAgICBub2RlPy5tYWtlQWxsVmlzaWJsZUJlbG93KClcbiAgICBub2RlPy51cGRhdGVNYXAoKVxuICAgIGZhbHNlXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5yZXBvcnRTZWN0aW9uJykucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBXaGFsZXNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMjgsNTQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gZWFjaCB5ZWFyIGZvciBhbGwgdHJhbnNpdHM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNoYW5nZSBpbiBsZW5ndGhcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZnVlbFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJ0b25zRnVlbENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gZnVlbCBjb25zdW1wdGlvblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJjb3N0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPiRcIik7Xy5iKF8udihfLmYoXCJjb3N0Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiB2b3lhZ2UgY29zdHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+Tm8gc2lnbmlmaWNhbnQgZGlmZmVyZW5jZSBmcm9tIGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY28yRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gIGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfY28yX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMDk3LDEwOTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19jbzJfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTQzOCwxNDQwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTc3OCwxNzgwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPjxpPk5vdGU6IEVtaXNzaW9ucyBudW1iZXJzIGFyZSBiYXNlZCBvbiBhdmVyYWdlcyBhbmQgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuIEVzdGltYXRlcyBhc3N1bWUgYSB2ZXNzZWwgc3BlZWQgb2YgMTYga25vdHMuPC9pPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS1cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJub3hFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Tk88c3ViPng8L3N1Yj4gRW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibm94RW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gdG9ucyBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPkFzc3VtaW5nIGEgc3BlZWQgb2YgMTYga25vdHMsIE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBhcHByb3hpbWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5ld19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDI1MjYsMjUyOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJvcmlnX25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48aT5Ob3RlOiBFbWlzc2lvbnMgbnVtYmVycyBhcmUgYmFzZWQgb24gYXZlcmFnZXMgYW5kIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNvbXBhcmF0aXZlIHB1cnBvc2VzLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJwbUVtaXNzaW9uc0NoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5QTTxzdWI+MTA8L3N1Yj4gRW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwicG1FbWlzc2lvbnNQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiB0b25zIFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPkFzc3VtaW5nIGEgc3BlZWQgb2YgMTYga25vdHMsIFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMzIyNiwzMjI4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48aT5Ob3RlOiBFbWlzc2lvbnMgbnVtYmVycyBhcmUgYmFzZWQgb24gYXZlcmFnZXMgYW5kIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNvbXBhcmF0aXZlIHB1cnBvc2VzLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pkxlbmd0aDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYW5lX2xlbmd0aFxcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJsZW5ndGhfZGlmZlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFRoZSBuZXcgc2hpcHBpbmcgbGFuZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBuYXV0aWNhbCBtaWxlcywgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbmF1dGljYWwgbWlsZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XCIpO2lmKF8ucyhfLmYoXCJsZW5ndGhJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMzE5LDMyNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwibG9uZ2VyXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibGVuZ3RoSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2hvcnRlclwiKTt9O18uYihcIiB0aGFuIHRoZSBvcmlnaW5hbCBzaGlwcGluZyBsYW5lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaW50ZXJzZWN0c1JpZ1wiLGMscCwxKSxjLHAsMCw0NjAsNzM2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIG9pbFJpZyB3YXJuaW5nIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PaWwgUGxhdGZvcm0gSW50ZXJzZWN0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBZb3VyIHByb3Bvc2FsIG92ZXJsYXBzIHRoZSBzYWZldHkgYXJlYSBhcm91bmQgYW4gb2lsIHBsYXRmb3JtIVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NGFjNTBmZDBlN2Y4NmNmNzkwOWFiZDJcXFwiPnNob3cgcGxhdGZvcm1zPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInByb3Bvc2FsRW1pc3Npb25zXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwiY28yRW1pc3Npb25zQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgc3R5bGU9XFxcImZvbnQtc3R5bGU6aXRhbGljO1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIGZvbGxvd2luZyBlc3RpbWF0ZXMgYXJlIHRoZSByZXN1bHQgb2YgY2hhbmdlcyBpbiBlbWlzc2lvbnMgYmFzZWQgb24gY2hhbmdlcyB0byB0aGUgc2hpcHBpbmcgbGFuZSBsZW5ndGggYW5kIHRoZSBpbnRyb2R1Y3Rpb24gb2YgU3BlZWQgUmVkdWN0aW9uIFpvbmVzOlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZW1pc3Npb25zUmVkdWN0aW9uc1wiLGMscCwxKSxjLHAsMCwzMjEsMjg2MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgIFx0XHQ8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5Gb3Igc2hpcHBpbmcgbGFuZSA8ZGl2IGNsYXNzPVxcXCJsYW5lLW5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L2Rpdj4sIGVtaXNzaW9uIHJlZHVjdGlvbnMgYXJlOjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICBcdFx0PGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zLXJlcG9ydFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIk5PX0NPMl9DSEFOR0VcIixjLHAsMSksYyxwLDAsNTA1LDcwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgIFx0XHRcdFx0XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPGRpdiBjbGFzcz1cXFwibm9fZW1pc3Npb25zX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHQ8c3Ryb25nPk5vIGNoYW5nZTwvc3Ryb25nPiBpbiA8L3NwYW4+IENPPHN1Yj4yPC9zdWI+IGVtaXNzaW9ucyBvZiBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX0NPMl9DSEFOR0VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJcdFx0ICBcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJDTzJfQ0hBTkdFX0NMQVNTXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9ucyBcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gQ088c3ViPjI8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMDY5LDEwNzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfQ08yXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIk5PX05PWF9DSEFOR0VcIixjLHAsMSksYyxwLDAsMTI5MiwxNDkyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8ZGl2IGNsYXNzPVxcXCJub19lbWlzc2lvbnNfY2hhbmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdDxzdHJvbmc+Tm8gY2hhbmdlPC9zdHJvbmc+IGluIDwvc3Bhbj4gTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zIG9mIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfTk9YXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19OT1hfQ0hBTkdFXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcIk5PWF9DSEFOR0VfQ0xBU1NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19OT1hcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTg1MiwxODU0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX05PWFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJOT19QTTEwX0NIQU5HRVwiLGMscCwxKSxjLHAsMCwyMDc2LDIyNzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0XHRcdFx0IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDxkaXYgY2xhc3M9XFxcIm5vX2VtaXNzaW9uc19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0PHN0cm9uZz5ObyBjaGFuZ2U8L3N0cm9uZz4gaW4gPC9zcGFuPiBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zIG9mIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfUE0xMFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX1BNMTBfQ0hBTkdFXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcIlBNMTBfQ0hBTkdFX0NMQVNTXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIlBFUkNfUE0xMFwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gUE08c3ViPjEwPC9zdWI+IGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwPjxzdHJvbmc+UE08c3ViPjEwPC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBhcHByb3hpbWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfUE0xMFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDI2MzksMjY0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX1BNMTBcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0ICAgIFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O18uYihcIlx0ICAgIFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdCAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wicHJvcG9zYWxPdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxOCw0MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8aDQ+QXR0cmlidXRlcyBmb3IgXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMjc4LDM4NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXHQgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlpvbmUgU2l6ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ6b25lc1wiLGMscCwxKSxjLHAsMCw1MjgsNjg3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgc2VsZWN0ZWQgcHJvcG9zYWwgY29udGFpbnMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTQ19JRFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBza2V0Y2hlcyB0aGF0IHRvdGFsIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0laRV9TUU1JXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IHNxdWFyZSBtaWxlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaGlwcGluZyBMYW5lIExlbmd0aHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJsZW5ndGhzXCIsYyxwLDEpLGMscCwwLDc5MCw5MjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBwcm9wb3NlZCBzaGlwcGluZyBsYW5lIDxzdHJvbmc+J1wiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCInPC9zdHJvbmc+IGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0xFTkdUSFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBtaWxlcyBsb25nLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInNoaXBwaW5nTGFuZVJlcG9ydFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiaW50ZXJzZWN0c1JpZ1wiLGMscCwxKSxjLHAsMCwxOCwyOTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gb2lsUmlnIHdhcm5pbmcgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9pbCBQbGF0Zm9ybSBJbnRlcnNlY3Rpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFlvdXIgcHJvcG9zYWwgb3ZlcmxhcHMgdGhlIHNhZmV0eSBhcmVhIGFyb3VuZCBhbiBvaWwgcGxhdGZvcm0hXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjJiNDU1Yzk2MDAzZGMxMzAxM2U4NFxcXCI+c2hvdyBwbGF0Zm9ybXM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3MgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCIgY29sbGFwc2VkXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XaGFsZSBTaWdodGluZ3M8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+TnVtYmVyIG9mIHdoYWxlIHNpZ2h0aW5ncyB3aXRoaW4gdGhpcyBmb290cHJpbnQgY29tcGFyZWQgdG8gZXhpc3Rpbmcgc2hpcHBpbmcgbGFuZXMuIFNpZ2h0aW5ncyBhcmUgcmVjb3JkZWQgYnkgd2hhbGV3YXRjaGluZyB2ZXNzZWxzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwid2hhbGVTaWdodGluZ3NcIixjLHAsMSksYyxwLDAsNjAxLDc4MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxsaSBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+XCIpO18uYihfLnYoXy5mKFwic2NpZW50aWZpY05hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcImRpZmYgXCIpO18uYihfLnYoXy5mKFwiY2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcInBlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNvdW50XFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48L2xpPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgY2xhc3M9XFxcIm1vcmVSZXN1bHRzXFxcIiBocmVmPVxcXCIjXFxcIj5tb3JlIHJlc3VsdHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBzdHlsZT1cXFwiZmxvYXQ6cmlnaHQ7XFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyYjQ1NWM5NjAwM2RjMTMwMTNlNDVcXFwiPnNob3cgc2lnaHRpbmdzIGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiY29zdHMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgYW5kIEZ1ZWwgQ29zdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+VGhlIG5ldyBzaGlwcGluZyBsYW5lIGhhcyBhIGxlbmd0aCBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5ld19sZW5ndGhcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbWlsZXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwwLDExODAsMTU5OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aFBlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IGVhY2ggeWVhciBmb3IgYWxsIHRyYW5zaXRzPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBjaGFuZ2UgaW4gbGVuZ3RoXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImZ1ZWxcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwidG9uc0Z1ZWxDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGluIGZ1ZWwgY29uc3VtcHRpb25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiY29zdFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj4kXCIpO18uYihfLnYoXy5mKFwiY29zdENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gdm95YWdlIGNvc3RzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgPHAgY2xhc3M9XFxcInN1bW1hcnlcXFwiPk5vIHNpZ25pZmljYW50IGRpZmZlcmVuY2UgZnJvbSBleGlzdGluZyBjb25maWd1cmF0aW9uLjwvcD5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIGhhYml0YXQgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNlbnNpdGl2ZSBCbHVlIFdoYWxlIEhhYml0YXQ8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJpbnRlcnNlY3RlZElzb2JhdGhNXCIsYyxwLDApKSk7Xy5iKFwiIHNxdWFyZSBtZXRlcnMgb2Ygc2Vuc2l0aXZlIGhhYml0YXQgZGlzdHVyYmVkLjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiY2hhbmdlIFwiKTtfLmIoXy52KF8uZihcImlzb2JhdGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwiaXNvYmF0aFBlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ3aGFsZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpZ2h0aW5ncyBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIiBjb2xsYXBzZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PldoYWxlIFNpZ2h0aW5nczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5OdW1iZXIgb2Ygd2hhbGUgc2lnaHRpbmdzIHdpdGhpbiB0aGlzIGZvb3RwcmludCBjb21wYXJlZCB0byBleGlzdGluZyBzaGlwcGluZyBsYW5lcy4gU2lnaHRpbmdzIGFyZSByZWNvcmRlZCBieSB3aGFsZXdhdGNoaW5nIHZlc3NlbHMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ3aGFsZVNpZ2h0aW5nc1wiLGMscCwxKSxjLHAsMCwyODcsNDY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiZGlmZiBcIik7Xy5iKF8udihfLmYoXCJjaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiY291bnRcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBjbGFzcz1cXFwibW9yZVJlc3VsdHNcXFwiIGhyZWY9XFxcIiNcXFwiPm1vcmUgcmVzdWx0czwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1NDFhOWFiY2RhYzRjYWEwMjVhM2JhOFxcXCI+c2hvdyBlZmZvcnQgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBoYWJpdGF0IFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZW5zaXRpdmUgQmx1ZSBXaGFsZSBIYWJpdGF0PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiaW50ZXJzZWN0ZWRJc29iYXRoTVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWV0ZXJzIG9mIHNlbnNpdGl2ZSBoYWJpdGF0IGRpc3R1cmJlZC48L3NwYW4+PC9icj48c3BhbiBjbGFzcz1cXFwiY2hhbmdlIFwiKTtfLmIoXy52KF8uZihcImlzb2JhdGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwiaXNvYmF0aFBlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ6b25lT3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMTgsNDM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PGg0PkF0dHJpYnV0ZXMgZm9yIFwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPlZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDI3OCwzODQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5UaGUgc2VsZWN0ZWQgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNTYwLDU5MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwicHJvcG9zYWwgY29udGFpbnMgem9uZXMgdGhhdCBhcmUgXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0XCIpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIHpvbmUgaXMgXCIpO307Xy5iKFwiIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiem9uZXNpemVcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc3F1YXJlIG1pbGVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiem9uZVdoYWxlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5XaGFsZSBTaWdodGluZ3M8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ3aGFsZVNpZ2h0aW5nc1wiLGMscCwxKSxjLHAsMCwxMTIsMjMyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiY291bnRcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBjbGFzcz1cXFwibW9yZVJlc3VsdHNcXFwiIGhyZWY9XFxcIiNcXFwiPm1vcmUgcmVzdWx0czwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1NDFhOWFiY2RhYzRjYWEwMjVhM2JhOFxcXCI+c2hvdyBlZmZvcnQgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59Il19
