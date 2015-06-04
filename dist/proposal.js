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
var ProposalEmissionsTab, ProposalOverviewTab, ZoneWhalesTab;

ProposalOverviewTab = require('./proposalOverviewTab.coffee');

ProposalEmissionsTab = require('./proposalEmissionsTab.coffee');

ZoneWhalesTab = require('./zoneWhalesTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([ProposalOverviewTab, ProposalEmissionsTab, ZoneWhalesTab]);
  return report.stylesheets(['./report.css']);
});


},{"./proposalEmissionsTab.coffee":12,"./proposalOverviewTab.coffee":13,"./zoneWhalesTab.coffee":15}],12:[function(require,module,exports){
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
    var context, emissions, emissionsReductions, reductions, _i, _len, _ref1;
    window.results = this.results;
    emissions = this.recordSet('EmissionsReduction', 'Emissions').toArray();
    reductions = this.parseReductions(emissions);
    emissionsReductions = [];
    _ref1 = Object.keys(reductions);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      key = _ref1[_i];
      console.log("red: ", reductions[key]);
      emissionsReductions.push(reductions[key]);
    }
    context = {
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      emissionsReductions: emissionsReductions
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
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
        console.log("its orig", er.CO2);
        currRed.ORIG_CO2 = er.CO2;
        currRed.ORIG_NOX = er.NOX;
        currRed.ORIG_SOX = er.SOX;
        currRed.ORIG_PM10 = er.PM10;
      } else if (type === "NEW") {
        console.log('its new:', er.CO2);
        currRed.NEW_CO2 = er.CO2;
        currRed.NEW_NOX = er.NOX;
        currRed.NEW_SOX = er.SOX;
        currRed.NEW_PM10 = er.PM10;
      } else {
        currRed.PERC_CO2 = parseFloat(er.CO2);
        console.log("perc co2: ", er.CO2);
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var ProposalOverviewTab, ReportTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
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
    var context, isCollection, l, lengths, zonesizes, _i, _len;
    window.results = this.results;
    isCollection = this.model.isCollection();
    lengths = this.recordSet('ShippingLaneLengthForProposal', 'Lengths').toArray();
    zonesizes = this.recordSet('ZoneSize', 'Size').toArray();
    for (_i = 0, _len = lengths.length; _i < _len; _i++) {
      l = lengths[_i];
      l.NEW_LENGTH = parseFloat(l.NEW_LENGTH).toFixed(1);
    }
    context = {
      lengths: lengths,
      zones: zonesizes
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  return ProposalOverviewTab;

})(ReportTab);

module.exports = ProposalOverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],14:[function(require,module,exports){
module.exports = [
  {
    id: 'Blue',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    unchangedCount: 6094,
    count: 0
  }, {
    id: 'Humpback',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    unchangedCount: 8554,
    count: 0
  }, {
    id: 'Gray',
    name: 'Gray Whale',
    scientificName: 'Eschrichtius robustus',
    unchangedCount: 10339,
    count: 0
  }, {
    id: 'Fin',
    name: 'Fin Whale',
    scientificName: 'Balaenoptera physalus',
    unchangedCount: 121,
    count: 0
  }, {
    id: 'Minke',
    name: 'Minke Whale',
    scientificName: 'Balaenoptera acutorostrata',
    unchangedCount: 385,
    count: 0
  }, {
    id: 'Pilot Whale',
    name: 'Pilot Whale',
    scientificName: 'Globicephala macrorhynchus',
    unchangedCount: 3,
    count: 0
  }
];


},{}],15:[function(require,module,exports){
var ReportTab, ZoneWhalesTab, addCommas, key, partials, sightingsTemplate, templates, val, _partials, _ref,
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

ZoneWhalesTab = (function(_super) {
  __extends(ZoneWhalesTab, _super);

  function ZoneWhalesTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    _ref = ZoneWhalesTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ZoneWhalesTab.prototype.name = 'Whales';

  ZoneWhalesTab.prototype.className = 'whales';

  ZoneWhalesTab.prototype.template = templates.zoneWhales;

  ZoneWhalesTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  ZoneWhalesTab.prototype.dependencies = ['WhaleOverlapTool', 'SensitiveWhaleOverlap'];

  ZoneWhalesTab.prototype.render = function() {
    var context, countData, feature, record, sensitiveWhales, sightings, sightingsData, sightings_perc, sightings_tot, species, sw, whaleSightings, _i, _j, _k, _len, _len1, _len2;
    window.results = this.results;
    whaleSightings = this.recordSet('WhaleOverlapTool', 'WhaleCount').toArray();
    sensitiveWhales = this.recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray();
    for (_i = 0, _len = sensitiveWhales.length; _i < _len; _i++) {
      sw = sensitiveWhales[_i];
      sw.BLUE_TOT = 2809;
      sw.BLUE_SQM = Math.round(sw.BLUE_SQM);
      sw.GRAY_TOT = 50667;
      sw.GRAY_SQM = Math.round(sw.GRAY_SQM);
      sw.HUMP_TOT = 1267;
      sw.HUMP_SQM = Math.round(sw.HUMP_SQM);
    }
    sightings = {};
    sightings_tot = {};
    sightings_perc = {};
    for (_j = 0, _len1 = whaleSightings.length; _j < _len1; _j++) {
      feature = whaleSightings[_j];
      species = feature.Species;
      if (__indexOf.call(_.keys(sightings), species) < 0) {
        sightings[feature.Species] = 0;
      }
      sightings[species] = sightings[species] + parseInt(feature.FREQUENCY);
      sightings_tot[species] = feature.count_tot;
      sightings_perc[species] = feature.count_perc;
    }
    sightingsData = _.map(sightingsTemplate, function(s) {
      return _.clone(s);
    });
    countData = [];
    for (_k = 0, _len2 = sightingsData.length; _k < _len2; _k++) {
      record = sightingsData[_k];
      record.count_tot = sightings_tot[record.id];
      record.count_perc = sightings_perc[record.id];
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
      if (record.count !== 0) {
        countData.push(record);
      }
    }
    context = {
      sketchClass: this.app.sketchClasses.get(this.model.get('sketchclass')).forTemplate(),
      sketch: this.model.forTemplate(),
      whaleSightings: countData,
      sensitiveWhales: sensitiveWhales
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  ZoneWhalesTab.prototype._handleReportLayerClick = function(e) {
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

  ZoneWhalesTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return ZoneWhalesTab;

})(ReportTab);

module.exports = ZoneWhalesTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./sightingsTemplate.coffee":14,"reportTab":"a21iR2"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["emissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!--");_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,128,546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);if(_.s(_.f("noEmissionsChange",c,p,1),c,p,0,845,976,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("              <strong>No significant change</strong> in emissions.");_.b("\n" + i);_.b("          </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noEmissionsChange",c,p,1),c,p,1,0,0,"")){_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("co2EmissionsPercentChange",c,p,0)));_.b("</span>  emissions</p>");_.b("\n" + i);_.b("    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_co2_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1300,1302,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_co2_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1641,1643,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,1981,1983,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n");};_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes. Estimates assume a vessel speed of 16 knots.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("noxEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>NO<sub>x</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("noxEmissionsPercentChange",c,p,0)));_.b("</span> tons NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, NO<sub>x</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,2754,2756,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("pmEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>PM<sub>10</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("pmEmissionsPercentChange",c,p,0)));_.b("</span> tons PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, PM<sub>10</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,3454,3456,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"distance reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Length</h4>");_.b("\n" + i);if(_.s(_.f("noLengthChange",c,p,1),c,p,0,98,228,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"no_change\">");_.b("\n" + i);_.b("      <strong>No significant change</strong> in shipping lane length (of 158.35 miles).");_.b("\n" + i);_.b("    </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noLengthChange",c,p,1),c,p,1,0,0,"")){_.b("  	<p class=\"lane_length\"><span class=\"measure\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  	<div class=\"length_diff\">");_.b("\n" + i);_.b("  		The new shipping lane is <strong>");_.b(_.v(_.f("length",c,p,0)));_.b("</strong> nautical miles, <strong>");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</strong> nautical miles");_.b("\n" + i);_.b("  		");if(_.s(_.f("lengthIncreased",c,p,1),c,p,0,518,524,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("longer");});c.pop();}if(!_.s(_.f("lengthIncreased",c,p,1),c,p,1,0,0,"")){_.b("shorter");};_.b(" than the original shipping lane.");_.b("\n" + i);_.b("  	</div>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("intersectsRig",c,p,1),c,p,0,683,959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"54ac50fd0e7f86cf7909abd2\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n");return _.fl();;});
this["Templates"]["proposalEmissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);_.b("  	<div style=\"font-style:italic;\">");_.b("\n" + i);_.b("  		The following estimates are the result of changes in emissions based on changes to the shipping lane length and the introduction of Speed Reduction Zones:");_.b("\n" + i);_.b("  	</div>");_.b("\n" + i);if(_.s(_.f("emissionsReductions",c,p,1),c,p,0,321,2833,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  		<div class=\"in-report-header\">For shipping lane <div class=\"lane-name\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</div>, emission reductions are:</div>");_.b("\n" + i);_.b("	  		<div class=\"emissions-report\">");_.b("\n" + i);if(_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,0,505,694,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> CO<sub>2</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("		  			<div class=\"");_.b(_.v(_.f("CO2_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions \"><span class=\"measure\">");_.b(_.v(_.f("PERC_CO2",c,p,0)));_.b("</span> CO<sub>2</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1059,1061,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_CO2",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,0,1282,1472,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> NO<sub>x</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("				    </div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("NOX_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_NOX",c,p,0)));_.b("</span> NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1832,1834,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_NOX",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,0,2056,2243,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("				 ");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> PM<sub>10</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("PM10_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_PM10",c,p,0)));_.b("</span> PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,2609,2611,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("				    	");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_PM10",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("			    	</div>");_.b("\n");};_.b("	    	</div>");_.b("\n");});c.pop();}_.b("	  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("\n" + i);_.b("  ");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["proposalOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Zone Sizes</h4>");_.b("\n" + i);if(_.s(_.f("zones",c,p,1),c,p,0,528,687,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The selected proposal contains <strong>");_.b(_.v(_.f("SC_ID",c,p,0)));_.b("</strong> sketches that total <strong>");_.b(_.v(_.f("SIZE_SQMI",c,p,0)));_.b("</strong> square miles.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Shipping Lane Lengths</h4>");_.b("\n" + i);if(_.s(_.f("lengths",c,p,1),c,p,0,790,928,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The proposed shipping lane <strong>'");_.b(_.v(_.f("NAME",c,p,0)));_.b("'</strong> is <strong>");_.b(_.v(_.f("NEW_LENGTH",c,p,0)));_.b("</strong> miles long.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["shippingLaneReport"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("intersectsRig",c,p,1),c,p,0,18,294,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f2b455c96003dc13013e84\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,601,780,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"diff ");_.b(_.v(_.f("changeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"51f2b455c96003dc13013e45\">show sightings layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);_.b("  <p>The new shipping lane has a length of <strong>");_.b(_.v(_.f("new_length",c,p,0)));_.b("</strong> miles.</p>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,1180,1598,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection habitat ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Sensitive Blue Whale Habitat</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("intersectedIsobathM",c,p,0)));_.b(" square meters of sensitive habitat disturbed.</span><span class=\"change ");_.b(_.v(_.f("isobathChangeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("isobathPercentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["whales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corp Observations</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,316,482,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("      <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n" + i);_.b("    </li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas </h4>");_.b("\n" + i);_.b("  <p>Square miles of biologically important areas within this footprint, as well as the total percentage of the biologically important areas within the study area.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,966,1580,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("BLUE_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("BLUE_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("GRAY_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("GRAY_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("HUMP_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("HUMP_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("</div>");return _.fl();;});
this["Templates"]["zoneOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  	<p class=\"large\">The selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,560,593,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("proposal contains zones that are ");});c.pop();}_.b("\n" + i);_.b("  		");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" zone is ");};_.b(" <strong>");_.b(_.v(_.f("zonesize",c,p,0)));_.b("</strong> square miles.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneWhales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corp Observations</h4>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,141,307,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("      <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n" + i);_.b("    </li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas</h4>");_.b("\n" + i);_.b("  <p>Square miles of biologically important areas within this footprint, as well as the total percentage of the biologically important areas within the study area.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,790,1404,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("BLUE_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("BLUE_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("GRAY_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("GRAY_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("HUMP_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("HUMP_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9wcm9wb3NhbC5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3Byb3Bvc2FsRW1pc3Npb25zVGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvcHJvcG9zYWxPdmVydmlld1RhYi5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL3NjcmlwdHMvem9uZVdoYWxlc1RhYi5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFB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QUFDLENBQUssQ0FBZCxLQUFRO0NBRFIsQ0FFZ0IsSUFBaEIsR0FGQSxLQUVBO0NBRkEsQ0FHaUIsSUFBakIsU0FBQTtDQTVDRixLQUFBO0NBQUEsQ0E4Q29DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVM7Q0FDbEIsRUFBRCxDQUFDLE9BQUQsUUFBQTtDQXhERixFQVFROztDQVJSLEVBMkR5QixNQUFDLGNBQTFCO0NBQ0UsT0FBQSxDQUFBO0NBQUEsR0FBQSxVQUFBO0NBQUEsRUFDQSxDQUFBLEVBQU07Q0FETixFQUVPLENBQVAsRUFBYSxHQUEwQyxFQUFWLENBQXRDLEdBQTBCOztDQUMzQixHQUFGLEVBQUosS0FBQTtNQUhBOztDQUlNLEdBQUYsRUFBSixhQUFBO01BSkE7O0NBS00sR0FBRixFQUFKLEdBQUE7TUFMQTtDQUR1QixVQU92QjtDQWxFRixFQTJEeUI7O0NBM0R6QixFQW9Fb0IsTUFBQyxTQUFyQjs7O0NBQ0csT0FBRDs7TUFBQTtDQUNBLEtBQUEsQ0FBQSxJQUFBLEtBQUE7Q0F0RUYsRUFvRW9COztDQXBFcEI7O0NBRDBCOztBQXlFNUIsQ0EzRkEsRUEyRmlCLEdBQVgsQ0FBTixNQTNGQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIlByb3Bvc2FsT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL3Byb3Bvc2FsT3ZlcnZpZXdUYWIuY29mZmVlJ1xuUHJvcG9zYWxFbWlzc2lvbnNUYWIgPSByZXF1aXJlICcuL3Byb3Bvc2FsRW1pc3Npb25zVGFiLmNvZmZlZSdcblpvbmVXaGFsZXNUYWIgPSByZXF1aXJlICcuL3pvbmVXaGFsZXNUYWIuY29mZmVlJ1xud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbUHJvcG9zYWxPdmVydmlld1RhYiwgUHJvcG9zYWxFbWlzc2lvbnNUYWIsIFpvbmVXaGFsZXNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuc2lnaHRpbmdzVGVtcGxhdGUgPSByZXF1aXJlICcuL3NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSdcblxuYWRkQ29tbWFzID0gKG5TdHIpIC0+XG4gIG5TdHIgKz0gJydcbiAgeCA9IG5TdHIuc3BsaXQoJy4nKVxuICB4MSA9IHhbMF1cbiAgeDIgPSBpZiB4Lmxlbmd0aCA+IDEgdGhlbiAnLicgKyB4WzFdIGVsc2UgJydcbiAgcmd4ID0gLyhcXGQrKShcXGR7M30pL1xuICB3aGlsZSAocmd4LnRlc3QoeDEpKVxuICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICByZXR1cm4geDEgKyB4MlxuXG5jbGFzcyBQcm9wb3NhbEVtaXNzaW9uc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRW1pc3Npb25zJ1xuICBjbGFzc05hbWU6ICdlbWlzc2lvbnMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMucHJvcG9zYWxFbWlzc2lvbnNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbICdFbWlzc2lvbnNSZWR1Y3Rpb24nXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG4gICAgZW1pc3Npb25zID0gQHJlY29yZFNldCgnRW1pc3Npb25zUmVkdWN0aW9uJywgJ0VtaXNzaW9ucycpLnRvQXJyYXkoKSAgICBcbiAgICByZWR1Y3Rpb25zID0gQHBhcnNlUmVkdWN0aW9ucyBlbWlzc2lvbnNcbiAgICBlbWlzc2lvbnNSZWR1Y3Rpb25zID0gW11cbiAgICBmb3Iga2V5IGluIE9iamVjdC5rZXlzKHJlZHVjdGlvbnMpXG4gICAgICBjb25zb2xlLmxvZyhcInJlZDogXCIsIHJlZHVjdGlvbnNba2V5XSlcbiAgICAgIGVtaXNzaW9uc1JlZHVjdGlvbnMucHVzaChyZWR1Y3Rpb25zW2tleV0pXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaENsYXNzOiBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KEBtb2RlbC5nZXQgJ3NrZXRjaGNsYXNzJykuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgZW1pc3Npb25zUmVkdWN0aW9uczogZW1pc3Npb25zUmVkdWN0aW9uc1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIgY29udGV4dCwgQHBhcnRpYWxzXG5cbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIHBhcnNlUmVkdWN0aW9uczogKGVtaXNzaW9ucykgPT5cbiAgICByZWR1Y3Rpb25zID0ge31cbiAgICBwb3MgPSBcInBvc2l0aXZlXCJcbiAgICBuZWcgPSBcIm5lZ2F0aXZlXCJcbiAgICBub2NoYW5nZSA9IFwibm9jaGFuZ2VcIlxuICAgIGZvciBlciBpbiBlbWlzc2lvbnNcbiAgICAgIG5hbWUgPSBlci5OQU1FXG4gICAgICB0eXBlID0gZXIuTkVXX09SX09MRFxuICAgICAgaWYgcmVkdWN0aW9uc1tuYW1lXVxuICAgICAgICBjdXJyUmVkID0gcmVkdWN0aW9uc1tuYW1lXVxuICAgICAgZWxzZVxuICAgICAgICBjdXJyUmVkID0ge1wiTkFNRVwiOm5hbWV9XG4gICAgICAgIFxuXG4gICAgICBpZiB0eXBlID09IFwiT1JJR1wiXG4gICAgICAgIGNvbnNvbGUubG9nKFwiaXRzIG9yaWdcIiwgZXIuQ08yKVxuICAgICAgICBjdXJyUmVkLk9SSUdfQ08yID0gZXIuQ08yXG4gICAgICAgIGN1cnJSZWQuT1JJR19OT1ggPSBlci5OT1hcbiAgICAgICAgY3VyclJlZC5PUklHX1NPWCA9IGVyLlNPWFxuICAgICAgICBjdXJyUmVkLk9SSUdfUE0xMCA9IGVyLlBNMTBcbiAgICAgIGVsc2UgaWYgdHlwZSA9PSBcIk5FV1wiXG4gICAgICAgIGNvbnNvbGUubG9nKCdpdHMgbmV3OicsIGVyLkNPMilcbiAgICAgICAgY3VyclJlZC5ORVdfQ08yID0gZXIuQ08yXG4gICAgICAgIGN1cnJSZWQuTkVXX05PWCA9IGVyLk5PWFxuICAgICAgICBjdXJyUmVkLk5FV19TT1ggPSBlci5TT1hcbiAgICAgICAgY3VyclJlZC5ORVdfUE0xMCA9IGVyLlBNMTBcbiAgICAgIGVsc2VcbiAgICAgICAgY3VyclJlZC5QRVJDX0NPMiA9IHBhcnNlRmxvYXQoZXIuQ08yKVxuICAgICAgICBjb25zb2xlLmxvZyhcInBlcmMgY28yOiBcIiwgZXIuQ08yKVxuICAgICAgICBpZiBjdXJyUmVkLlBFUkNfQ08yID4gMFxuICAgICAgICAgIGN1cnJSZWQuQ08yX0NIQU5HRV9DTEFTUyA9IG5lZ1xuICAgICAgICAgIGN1cnJSZWQuY28yRW1pc3Npb25zSW5jcmVhc2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGN1cnJSZWQuUEVSQ19DTzIgPT0gMFxuICAgICAgICAgICAgY3VyclJlZC5OT19DTzJfQ0hBTkdFID0gdHJ1ZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fQ08yX0NIQU5HRSA9IGZhbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICBjdXJyUmVkLkNPMl9DSEFOR0VfQ0xBU1MgPSBwb3NcbiAgICAgICAgICBjdXJyUmVkLlBFUkNfQ08yID0gTWF0aC5hYnMoY3VyclJlZC5QRVJDX0NPMilcbiAgICAgICAgICBjdXJyUmVkLmNvMkVtaXNzaW9uc0luY3JlYXNlZCA9IHRydWVcblxuICAgICAgICBjdXJyUmVkLlBFUkNfTk9YID0gcGFyc2VGbG9hdChlci5OT1gpXG4gICAgICAgIGlmIGN1cnJSZWQuUEVSQ19OT1ggPiAwXG4gICAgICAgICAgY3VyclJlZC5OT1hfQ0hBTkdFX0NMQVNTID0gbmVnXG4gICAgICAgICAgY3VyclJlZC5ub3hFbWlzc2lvbnNJbmNyZWFzZWQgPSBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgaWYgY3VyclJlZC5QRVJDX05PWCA9PSAwXG4gICAgICAgICAgICBjdXJyUmVkLk5PX05PWF9DSEFOR0UgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3VyclJlZC5OT19OT1hfQ0hBTkdFID0gZmFsc2VcbiAgICAgICAgICBcbiAgICAgICAgICBjdXJyUmVkLk5PWF9DSEFOR0VfQ0xBU1MgPSBwb3NcblxuICAgICAgICAgIGN1cnJSZWQuUEVSQ19OT1ggPSBNYXRoLmFicyhjdXJyUmVkLlBFUkNfTk9YKVxuICAgICAgICAgIGN1cnJSZWQubm94RW1pc3Npb25zSW5jcmVhc2VkID0gdHJ1ZVxuXG4gICAgICAgIGN1cnJSZWQuUEVSQ19TT1ggPSBwYXJzZUZsb2F0KGVyLlNPWClcbiAgICAgICAgaWYgY3VyclJlZC5QRVJDX1NPWCA+IDBcbiAgICAgICAgICBjdXJyUmVkLlNPWF9DSEFOR0VfQ0xBU1MgPSBuZWdcbiAgICAgICAgICBjdXJyUmVkLnNveEVtaXNzaW9uc0luY3JlYXNlZCA9IGZhbHNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiBjdXJyUmVkLlBFUkNfU09YID09IDBcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fU09YX0NIQU5HRSA9IHRydWVcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJyUmVkLk5PX1NPWF9DSEFOR0UgPSBmYWxzZVxuXG4gICAgICAgICAgY3VyclJlZC5TT1hfQ0hBTkdFX0NMQVNTID0gcG9zXG4gICAgICAgICAgY3VyclJlZC5QRVJDX1NPWCA9IE1hdGguYWJzKGN1cnJSZWQuUEVSQ19TT1gpXG4gICAgICAgICAgY3VyclJlZC5zb3hFbWlzc2lvbnNJbmNyZWFzZWQgPSB0cnVlXG5cbiAgICAgICAgY3VyclJlZC5QRVJDX1BNMTAgPSBwYXJzZUZsb2F0KGVyLlBNMTApXG4gICAgICAgIGlmIGN1cnJSZWQuUEVSQ19QTTEwID4gMFxuICAgICAgICAgIGN1cnJSZWQuUE0xMF9DSEFOR0VfQ0xBU1MgPSBuZWdcbiAgICAgICAgICBjdXJyUmVkLnBtRW1pc3Npb25zSW5jcmVhc2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIGN1cnJSZWQuUEVSQ19QTTEwID09IDBcbiAgICAgICAgICAgIGN1cnJSZWQuTk9fUE0xMF9DSEFOR0UgPSB0cnVlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3VyclJlZC5OT19QTTEwX0NIQU5HRSA9IGZhbHNlXG4gICAgICAgICAgXG4gICAgICAgICAgY3VyclJlZC5QTTEwX0NIQU5HRV9DTEFTUyA9IHBvc1xuXG4gICAgICAgICAgY3VyclJlZC5QRVJDX1BNMTAgPSBNYXRoLmFicyhjdXJyUmVkLlBFUkNfUE0xMClcbiAgICAgICAgICBjdXJyUmVkLnBtRW1pc3Npb25zSW5jcmVhc2VkID0gdHJ1ZVxuXG5cbiAgICAgIHJlZHVjdGlvbnNbbmFtZV0gPSBjdXJyUmVkXG4gICAgICBcbiAgICByZXR1cm4gcmVkdWN0aW9uc1xuXG5cbiAgICAjIFNob3VsZG4ndCB3ZSBnaXZlIHNvbWUgZmVlZGJhY2sgdG8gdGhlIHVzZXIgaWYgdGhlIGxheWVyIGlzbid0IHByZXNlbnQgaW4gdGhlIGxheWVyIHRyZWU/XG4gIF9oYW5kbGVSZXBvcnRMYXllckNsaWNrOiAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB1cmwgPSAkKGUudGFyZ2V0KS5hdHRyKCdocmVmJylcbiAgICBub2RlID0gd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UuZGF0YVNpZGViYXIubGF5ZXJUcmVlLmdldE5vZGVCeVVybCB1cmxcbiAgICBub2RlPy5tYWtlVmlzaWJsZSgpXG4gICAgbm9kZT8ubWFrZUFsbFZpc2libGVCZWxvdygpXG4gICAgbm9kZT8udXBkYXRlTWFwKClcbiAgICBmYWxzZVxuXG4gIG9uTW9yZVJlc3VsdHNDbGljazogKGUpID0+XG4gICAgZT8ucHJldmVudERlZmF1bHQ/KClcbiAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcucmVwb3J0U2VjdGlvbicpLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG5cblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wb3NhbEVtaXNzaW9uc1RhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5zaWdodGluZ3NUZW1wbGF0ZSA9IHJlcXVpcmUgJy4vc2lnaHRpbmdzVGVtcGxhdGUuY29mZmVlJ1xuXG5hZGRDb21tYXMgPSAoblN0cikgLT5cbiAgblN0ciArPSAnJ1xuICB4ID0gblN0ci5zcGxpdCgnLicpXG4gIHgxID0geFswXVxuICB4MiA9IGlmIHgubGVuZ3RoID4gMSB0aGVuICcuJyArIHhbMV0gZWxzZSAnJ1xuICByZ3ggPSAvKFxcZCspKFxcZHszfSkvXG4gIHdoaWxlIChyZ3gudGVzdCh4MSkpXG4gICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArICcsJyArICckMicpXG4gIHJldHVybiB4MSArIHgyXG5cbmNsYXNzIFByb3Bvc2FsT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5wcm9wb3NhbE92ZXJ2aWV3XG4gIGV2ZW50czpcbiAgICBcImNsaWNrIGFbcmVsPXRvZ2dsZS1sYXllcl1cIiA6ICdfaGFuZGxlUmVwb3J0TGF5ZXJDbGljaydcbiAgICBcImNsaWNrIGEubW9yZVJlc3VsdHNcIjogICAgICAgICdvbk1vcmVSZXN1bHRzQ2xpY2snXG4gIGRlcGVuZGVuY2llczogWydTaGlwcGluZ0xhbmVMZW5ndGhGb3JQcm9wb3NhbCcsJ1pvbmVTaXplJyBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHdpbmRvdy5yZXN1bHRzID0gQHJlc3VsdHNcbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcblxuICAgIGxlbmd0aHMgPSBAcmVjb3JkU2V0KCdTaGlwcGluZ0xhbmVMZW5ndGhGb3JQcm9wb3NhbCcsICdMZW5ndGhzJykudG9BcnJheSgpXG4gICAgem9uZXNpemVzID0gQHJlY29yZFNldCgnWm9uZVNpemUnLCAnU2l6ZScpLnRvQXJyYXkoKVxuICAgIGZvciBsIGluIGxlbmd0aHNcbiAgICAgIGwuTkVXX0xFTkdUSCA9IHBhcnNlRmxvYXQobC5ORVdfTEVOR1RIKS50b0ZpeGVkKDEpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIGxlbmd0aHM6IGxlbmd0aHNcbiAgICAgIHpvbmVzOiB6b25lc2l6ZXNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9wb3NhbE92ZXJ2aWV3VGFiIiwibW9kdWxlLmV4cG9ydHMgPSBbXG4gIHtcbiAgICBpZDogJ0JsdWUnXG4gICAgbmFtZTogJ0JsdWUgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdCYWxhZW5vcHRlcmEgbXVzY3VsdXMnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDYwOTRcbiAgICBjb3VudDogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdIdW1wYmFjaydcbiAgICBuYW1lOiAnSHVtcGJhY2sgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdNZWdhcHRlcmEgbm92YWVhbmdsaWFlJ1xuICAgIHVuY2hhbmdlZENvdW50OiA4NTU0XG4gICAgY291bnQ6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnR3JheSdcbiAgICBuYW1lOiAnR3JheSBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0VzY2hyaWNodGl1cyByb2J1c3R1cydcbiAgICB1bmNoYW5nZWRDb3VudDogMTAzMzlcbiAgICBjb3VudDogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdGaW4nXG4gICAgbmFtZTogJ0ZpbiBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0JhbGFlbm9wdGVyYSBwaHlzYWx1cydcbiAgICB1bmNoYW5nZWRDb3VudDogMTIxXG4gICAgY291bnQ6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnTWlua2UnXG4gICAgbmFtZTogJ01pbmtlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIGFjdXRvcm9zdHJhdGEnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDM4NVxuICAgIGNvdW50OiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ1BpbG90IFdoYWxlJ1xuICAgIG5hbWU6ICdQaWxvdCBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0dsb2JpY2VwaGFsYSBtYWNyb3JoeW5jaHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAzXG4gICAgY291bnQ6IDBcbiAgfVxuXVxuXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuc2lnaHRpbmdzVGVtcGxhdGUgPSByZXF1aXJlICcuL3NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSdcblxuYWRkQ29tbWFzID0gKG5TdHIpIC0+XG4gIG5TdHIgKz0gJydcbiAgeCA9IG5TdHIuc3BsaXQoJy4nKVxuICB4MSA9IHhbMF1cbiAgeDIgPSBpZiB4Lmxlbmd0aCA+IDEgdGhlbiAnLicgKyB4WzFdIGVsc2UgJydcbiAgcmd4ID0gLyhcXGQrKShcXGR7M30pL1xuICB3aGlsZSAocmd4LnRlc3QoeDEpKVxuICAgIHgxID0geDEucmVwbGFjZShyZ3gsICckMScgKyAnLCcgKyAnJDInKVxuICByZXR1cm4geDEgKyB4MlxuXG5jbGFzcyBab25lV2hhbGVzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdXaGFsZXMnXG4gIGNsYXNzTmFtZTogJ3doYWxlcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy56b25lV2hhbGVzXG4gIGV2ZW50czpcbiAgICBcImNsaWNrIGFbcmVsPXRvZ2dsZS1sYXllcl1cIiA6ICdfaGFuZGxlUmVwb3J0TGF5ZXJDbGljaydcbiAgICBcImNsaWNrIGEubW9yZVJlc3VsdHNcIjogICAgICAgICdvbk1vcmVSZXN1bHRzQ2xpY2snXG4gIGRlcGVuZGVuY2llczogWydXaGFsZU92ZXJsYXBUb29sJywgJ1NlbnNpdGl2ZVdoYWxlT3ZlcmxhcCddXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHdpbmRvdy5yZXN1bHRzID0gQHJlc3VsdHNcbiAgICB3aGFsZVNpZ2h0aW5ncyA9IEByZWNvcmRTZXQoJ1doYWxlT3ZlcmxhcFRvb2wnLCAnV2hhbGVDb3VudCcpLnRvQXJyYXkoKVxuICAgIHNlbnNpdGl2ZVdoYWxlcyA9IEByZWNvcmRTZXQoJ1NlbnNpdGl2ZVdoYWxlT3ZlcmxhcCcsICdTZW5zaXRpdmVXaGFsZScpLnRvQXJyYXkoKVxuICAgIFxuICAgIGZvciBzdyBpbiBzZW5zaXRpdmVXaGFsZXNcbiAgICAgIHN3LkJMVUVfVE9UID0gMjgwOVxuICAgICAgc3cuQkxVRV9TUU0gPSBNYXRoLnJvdW5kKHN3LkJMVUVfU1FNKVxuICAgICAgc3cuR1JBWV9UT1QgPSA1MDY2N1xuICAgICAgc3cuR1JBWV9TUU0gPSBNYXRoLnJvdW5kKHN3LkdSQVlfU1FNKVxuICAgICAgc3cuSFVNUF9UT1QgPSAxMjY3XG4gICAgICBzdy5IVU1QX1NRTSA9IE1hdGgucm91bmQoc3cuSFVNUF9TUU0pXG5cbiAgICBzaWdodGluZ3MgPSB7fVxuICAgIHNpZ2h0aW5nc190b3QgPSB7fVxuICAgIHNpZ2h0aW5nc19wZXJjID0ge31cblxuICAgIGZvciBmZWF0dXJlIGluIHdoYWxlU2lnaHRpbmdzXG4gICAgICBzcGVjaWVzID0gZmVhdHVyZS5TcGVjaWVzXG4gICAgICB1bmxlc3Mgc3BlY2llcyBpbiBfLmtleXMoc2lnaHRpbmdzKVxuICAgICAgICBzaWdodGluZ3NbZmVhdHVyZS5TcGVjaWVzXSA9IDBcbiAgICAgIHNpZ2h0aW5nc1tzcGVjaWVzXSA9IHNpZ2h0aW5nc1tzcGVjaWVzXSArIHBhcnNlSW50KGZlYXR1cmUuRlJFUVVFTkNZKVxuICAgICAgc2lnaHRpbmdzX3RvdFtzcGVjaWVzXSA9IGZlYXR1cmUuY291bnRfdG90XG4gICAgICBzaWdodGluZ3NfcGVyY1tzcGVjaWVzXSA9IGZlYXR1cmUuY291bnRfcGVyY1xuXG4gICAgc2lnaHRpbmdzRGF0YSA9IF8ubWFwIHNpZ2h0aW5nc1RlbXBsYXRlLCAocykgLT4gXy5jbG9uZShzKVxuICAgIGNvdW50RGF0YSA9IFtdXG4gICAgZm9yIHJlY29yZCBpbiBzaWdodGluZ3NEYXRhXG4gICAgICByZWNvcmQuY291bnRfdG90ID0gc2lnaHRpbmdzX3RvdFtyZWNvcmQuaWRdXG4gICAgICByZWNvcmQuY291bnRfcGVyYyA9IHNpZ2h0aW5nc19wZXJjW3JlY29yZC5pZF1cbiAgICAgIHJlY29yZC5jb3VudCA9IHNpZ2h0aW5nc1tyZWNvcmQuaWRdIGlmIHNpZ2h0aW5nc1tyZWNvcmQuaWRdXG4gICAgICByZWNvcmQuZGlmZiA9IHJlY29yZC5jb3VudCAtIHJlY29yZC51bmNoYW5nZWRDb3VudFxuICAgICAgcmVjb3JkLnBlcmNlbnRDaGFuZ2UgPSAgTWF0aC5yb3VuZCgoTWF0aC5hYnMocmVjb3JkLmRpZmYpL3JlY29yZC51bmNoYW5nZWRDb3VudCkgKiAxMDApXG4gICAgICBpZiByZWNvcmQucGVyY2VudENoYW5nZSBpcyBJbmZpbml0eSB0aGVuIHJlY29yZC5wZXJjZW50Q2hhbmdlID0gJz4xMDAnO1xuICAgICAgcmVjb3JkLmNoYW5nZUNsYXNzID0gaWYgcmVjb3JkLmRpZmYgPiAwIHRoZW4gJ3Bvc2l0aXZlJyBlbHNlICduZWdhdGl2ZSdcbiAgICAgIGlmIF8uaXNOYU4ocmVjb3JkLnBlcmNlbnRDaGFuZ2UpXG4gICAgICAgIHJlY29yZC5wZXJjZW50Q2hhbmdlID0gMFxuICAgICAgICByZWNvcmQuY2hhbmdlQ2xhc3MgPSAnbm9jaGFuZ2UnXG4gICAgICBpZiByZWNvcmQuY291bnQgIT0gMFxuICAgICAgICBjb3VudERhdGEucHVzaChyZWNvcmQpXG5cbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaENsYXNzOiBAYXBwLnNrZXRjaENsYXNzZXMuZ2V0KEBtb2RlbC5nZXQgJ3NrZXRjaGNsYXNzJykuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgd2hhbGVTaWdodGluZ3M6IGNvdW50RGF0YVxuICAgICAgc2Vuc2l0aXZlV2hhbGVzOiBzZW5zaXRpdmVXaGFsZXNcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgICAjIFNob3VsZG4ndCB3ZSBnaXZlIHNvbWUgZmVlZGJhY2sgdG8gdGhlIHVzZXIgaWYgdGhlIGxheWVyIGlzbid0IHByZXNlbnQgaW4gdGhlIGxheWVyIHRyZWU/XG4gIF9oYW5kbGVSZXBvcnRMYXllckNsaWNrOiAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB1cmwgPSAkKGUudGFyZ2V0KS5hdHRyKCdocmVmJylcbiAgICBub2RlID0gd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UuZGF0YVNpZGViYXIubGF5ZXJUcmVlLmdldE5vZGVCeVVybCB1cmxcbiAgICBub2RlPy5tYWtlVmlzaWJsZSgpXG4gICAgbm9kZT8ubWFrZUFsbFZpc2libGVCZWxvdygpXG4gICAgbm9kZT8udXBkYXRlTWFwKClcbiAgICBmYWxzZVxuXG4gIG9uTW9yZVJlc3VsdHNDbGljazogKGUpID0+XG4gICAgZT8ucHJldmVudERlZmF1bHQ/KClcbiAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcucmVwb3J0U2VjdGlvbicpLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gWm9uZVdoYWxlc1RhYiIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcImVtaXNzaW9uc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiY29zdHMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgYW5kIEZ1ZWwgQ29zdHM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwwLDEyOCw1NDYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHAgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBlYWNoIHllYXIgZm9yIGFsbCB0cmFuc2l0czwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImRpc3RhbmNlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgY2hhbmdlIGluIGxlbmd0aFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJmdWVsXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInRvbnNGdWVsQ2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiBmdWVsIGNvbnN1bXB0aW9uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImNvc3RcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+JFwiKTtfLmIoXy52KF8uZihcImNvc3RDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGluIHZveWFnZSBjb3N0c1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNpZ25pZmljYW50RGlzdGFuY2VDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj5ObyBzaWduaWZpY2FudCBkaWZmZXJlbmNlIGZyb20gZXhpc3RpbmcgY29uZmlndXJhdGlvbi48L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImVtaXNzaW9ucyByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImNvMkVtaXNzaW9uc0NoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FbWlzc2lvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub0VtaXNzaW9uc0NoYW5nZVwiLGMscCwxKSxjLHAsMCw4NDUsOTc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibm9fZW1pc3Npb25zX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8c3Ryb25nPk5vIHNpZ25pZmljYW50IGNoYW5nZTwvc3Ryb25nPiBpbiBlbWlzc2lvbnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub0VtaXNzaW9uc0NoYW5nZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnNcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiAgZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD48c3Ryb25nPkNPPHN1Yj4yPC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBhcHByb3hpbWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5ld19jbzJfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDEzMDAsMTMwMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJjbzJFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJvcmlnX2NvMl9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+PHN0cm9uZz5OTzxzdWI+eDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxNjQxLDE2NDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPjxzdHJvbmc+UE08c3ViPjEwPC9zdWI+PC9zdHJvbmc+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBhcHByb3hpbWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5ld19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxOTgxLDE5ODMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJvcmlnX3BtX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIDxwPjxpPk5vdGU6IEVtaXNzaW9ucyBudW1iZXJzIGFyZSBiYXNlZCBvbiBhdmVyYWdlcyBhbmQgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuIEVzdGltYXRlcyBhc3N1bWUgYSB2ZXNzZWwgc3BlZWQgb2YgMTYga25vdHMuPC9pPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwhLS1cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJub3hFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Tk88c3ViPng8L3N1Yj4gRW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibm94RW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gdG9ucyBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPkFzc3VtaW5nIGEgc3BlZWQgb2YgMTYga25vdHMsIE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9ucyBmb3IgdGhlIG5ldyBzaGlwcGluZyBsYW5lIGFyZSBhcHByb3hpbWF0ZWx5IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm5ld19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDI3NTQsMjc1NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJvcmlnX25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48aT5Ob3RlOiBFbWlzc2lvbnMgbnVtYmVycyBhcmUgYmFzZWQgb24gYXZlcmFnZXMgYW5kIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNvbXBhcmF0aXZlIHB1cnBvc2VzLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJwbUVtaXNzaW9uc0NoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5QTTxzdWI+MTA8L3N1Yj4gRW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwicG1FbWlzc2lvbnNQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiB0b25zIFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPkFzc3VtaW5nIGEgc3BlZWQgb2YgMTYga25vdHMsIFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMzQ1NCwzNDU2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD48aT5Ob3RlOiBFbWlzc2lvbnMgbnVtYmVycyBhcmUgYmFzZWQgb24gYXZlcmFnZXMgYW5kIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIGNvbXBhcmF0aXZlIHB1cnBvc2VzLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiLS0+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pkxlbmd0aDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm5vTGVuZ3RoQ2hhbmdlXCIsYyxwLDEpLGMscCwwLDk4LDIyOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcIm5vX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHN0cm9uZz5ObyBzaWduaWZpY2FudCBjaGFuZ2U8L3N0cm9uZz4gaW4gc2hpcHBpbmcgbGFuZSBsZW5ndGggKG9mIDE1OC4zNSBtaWxlcykuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJub0xlbmd0aENoYW5nZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFuZV9sZW5ndGhcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IGNsYXNzPVxcXCJsZW5ndGhfZGlmZlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIG5ldyBzaGlwcGluZyBsYW5lIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IG5hdXRpY2FsIG1pbGVzLCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBuYXV0aWNhbCBtaWxlc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFwiKTtpZihfLnMoXy5mKFwibGVuZ3RoSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDUxOCw1MjQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImxvbmdlclwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImxlbmd0aEluY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNob3J0ZXJcIik7fTtfLmIoXCIgdGhhbiB0aGUgb3JpZ2luYWwgc2hpcHBpbmcgbGFuZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImludGVyc2VjdHNSaWdcIixjLHAsMSksYyxwLDAsNjgzLDk1OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBvaWxSaWcgd2FybmluZyBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T2lsIFBsYXRmb3JtIEludGVyc2VjdGlvbjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgWW91ciBwcm9wb3NhbCBvdmVybGFwcyB0aGUgc2FmZXR5IGFyZWEgYXJvdW5kIGFuIG9pbCBwbGF0Zm9ybSFcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTRhYzUwZmQwZTdmODZjZjc5MDlhYmQyXFxcIj5zaG93IHBsYXRmb3JtczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJwcm9wb3NhbEVtaXNzaW9uc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImVtaXNzaW9ucyByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImNvMkVtaXNzaW9uc0NoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5FbWlzc2lvbnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IHN0eWxlPVxcXCJmb250LXN0eWxlOml0YWxpYztcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBmb2xsb3dpbmcgZXN0aW1hdGVzIGFyZSB0aGUgcmVzdWx0IG9mIGNoYW5nZXMgaW4gZW1pc3Npb25zIGJhc2VkIG9uIGNoYW5nZXMgdG8gdGhlIHNoaXBwaW5nIGxhbmUgbGVuZ3RoIGFuZCB0aGUgaW50cm9kdWN0aW9uIG9mIFNwZWVkIFJlZHVjdGlvbiBab25lczpcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImVtaXNzaW9uc1JlZHVjdGlvbnNcIixjLHAsMSksYyxwLDAsMzIxLDI4MzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICBcdFx0PGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+Rm9yIHNoaXBwaW5nIGxhbmUgPGRpdiBjbGFzcz1cXFwibGFuZS1uYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC9kaXY+LCBlbWlzc2lvbiByZWR1Y3Rpb25zIGFyZTo8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgXHRcdDxkaXYgY2xhc3M9XFxcImVtaXNzaW9ucy1yZXBvcnRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJOT19DTzJfQ0hBTkdFXCIsYyxwLDEpLGMscCwwLDUwNSw2OTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICBcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDxkaXYgY2xhc3M9XFxcIm5vX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHQ8c3Ryb25nPk5vIGNoYW5nZTwvc3Ryb25nPiBpbiA8L3NwYW4+IENPPHN1Yj4yPC9zdWI+IGVtaXNzaW9ucyBvZiBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX0NPMl9DSEFOR0VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJcdFx0ICBcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJDTzJfQ0hBTkdFX0NMQVNTXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9ucyBcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX0NPMlwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gQ088c3ViPjI8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX0NPMlwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMDU5LDEwNjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfQ08yXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIk5PX05PWF9DSEFOR0VcIixjLHAsMSksYyxwLDAsMTI4MiwxNDcyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0PHN0cm9uZz5ObyBjaGFuZ2U8L3N0cm9uZz4gaW4gPC9zcGFuPiBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnMgb2YgYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19OT1hcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX05PWF9DSEFOR0VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJcdFx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiTk9YX0NIQU5HRV9DTEFTU1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnNcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX05PWFwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHA+PHN0cm9uZz5OTzxzdWI+eDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX05PWFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxODMyLDE4MzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfTk9YXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcIk5PX1BNMTBfQ0hBTkdFXCIsYyxwLDEpLGMscCwwLDIwNTYsMjI0MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHRcdFx0XHQgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPGRpdiBjbGFzcz1cXFwibm9fY2hhbmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdDxzdHJvbmc+Tm8gY2hhbmdlPC9zdHJvbmc+IGluIDwvc3Bhbj4gUE08c3ViPjEwPC9zdWI+IGVtaXNzaW9ucyBvZiBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX1BNMTBcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19QTTEwX0NIQU5HRVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIlx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJQTTEwX0NIQU5HRV9DTEFTU1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnNcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJQRVJDX1BNMTBcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiTkVXX1BNMTBcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyNjA5LDI2MTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb3duXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHRcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiT1JJR19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdCAgICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCJcdCAgICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXHQgIDxwPjxpPk5vdGU6IEVtaXNzaW9ucyBudW1iZXJzIGFyZSBiYXNlZCBvbiBhdmVyYWdlcyBhbmQgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuPC9pPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInByb3Bvc2FsT3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImFueUF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMTgsNDM3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PGg0PkF0dHJpYnV0ZXMgZm9yIFwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+TmFtZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPlZhbHVlPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDI3OCwzODQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0ICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJ2YWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFx0PC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5ab25lIFNpemVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiem9uZXNcIixjLHAsMSksYyxwLDAsNTI4LDY4NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIHNlbGVjdGVkIHByb3Bvc2FsIGNvbnRhaW5zIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiU0NfSURcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc2tldGNoZXMgdGhhdCB0b3RhbCA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNJWkVfU1FNSVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBzcXVhcmUgbWlsZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2UgcmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2hpcHBpbmcgTGFuZSBMZW5ndGhzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibGVuZ3Roc1wiLGMscCwxKSxjLHAsMCw3OTAsOTI4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhcmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgcHJvcG9zZWQgc2hpcHBpbmcgbGFuZSA8c3Ryb25nPidcIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiJzwvc3Ryb25nPiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19MRU5HVEhcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbWlsZXMgbG9uZy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJzaGlwcGluZ0xhbmVSZXBvcnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImludGVyc2VjdHNSaWdcIixjLHAsMSksYyxwLDAsMTgsMjk0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIG9pbFJpZyB3YXJuaW5nIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5PaWwgUGxhdGZvcm0gSW50ZXJzZWN0aW9uPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBZb3VyIHByb3Bvc2FsIG92ZXJsYXBzIHRoZSBzYWZldHkgYXJlYSBhcm91bmQgYW4gb2lsIHBsYXRmb3JtIVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1MWYyYjQ1NWM5NjAwM2RjMTMwMTNlODRcXFwiPnNob3cgcGxhdGZvcm1zPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiIGNvbGxhcHNlZFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+V2hhbGUgU2lnaHRpbmdzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPk51bWJlciBvZiB3aGFsZSBzaWdodGluZ3Mgd2l0aGluIHRoaXMgZm9vdHByaW50IGNvbXBhcmVkIHRvIGV4aXN0aW5nIHNoaXBwaW5nIGxhbmVzLiBTaWdodGluZ3MgYXJlIHJlY29yZGVkIGJ5IHdoYWxld2F0Y2hpbmcgdmVzc2Vscy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIndoYWxlU2lnaHRpbmdzXCIsYyxwLDEpLGMscCwwLDYwMSw3ODAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJkaWZmIFwiKTtfLmIoXy52KF8uZihcImNoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJwZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJjb3VudFxcXCI+XCIpO18uYihfLnYoXy5mKFwiY291bnRcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+PC9saT5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPC91bD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGNsYXNzPVxcXCJtb3JlUmVzdWx0c1xcXCIgaHJlZj1cXFwiI1xcXCI+bW9yZSByZXN1bHRzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgc3R5bGU9XFxcImZsb2F0OnJpZ2h0O1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmMmI0NTVjOTYwMDNkYzEzMDEzZTQ1XFxcIj5zaG93IHNpZ2h0aW5ncyBsYXllcjwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlRoZSBuZXcgc2hpcHBpbmcgbGFuZSBoYXMgYSBsZW5ndGggb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbGVuZ3RoXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IG1pbGVzLjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMTgwLDE1OTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHAgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBlYWNoIHllYXIgZm9yIGFsbCB0cmFuc2l0czwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImRpc3RhbmNlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgY2hhbmdlIGluIGxlbmd0aFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJmdWVsXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInRvbnNGdWVsQ2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiBmdWVsIGNvbnN1bXB0aW9uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcImNvc3RcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+JFwiKTtfLmIoXy52KF8uZihcImNvc3RDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGluIHZveWFnZSBjb3N0c1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInNpZ25pZmljYW50RGlzdGFuY2VDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj5ObyBzaWduaWZpY2FudCBkaWZmZXJlbmNlIGZyb20gZXhpc3RpbmcgY29uZmlndXJhdGlvbi48L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBoYWJpdGF0IFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TZW5zaXRpdmUgQmx1ZSBXaGFsZSBIYWJpdGF0PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiaW50ZXJzZWN0ZWRJc29iYXRoTVwiLGMscCwwKSkpO18uYihcIiBzcXVhcmUgbWV0ZXJzIG9mIHNlbnNpdGl2ZSBoYWJpdGF0IGRpc3R1cmJlZC48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNoYW5nZSBcIik7Xy5iKF8udihfLmYoXCJpc29iYXRoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcImlzb2JhdGhQZXJjZW50Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wid2hhbGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3MgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCIgY29sbGFwc2VkXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5DaGFubmVsIElzbGFuZHMgTmF0dXJhbGlzdCBDb3JwIE9ic2VydmF0aW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5OdW1iZXIgb2Ygd2hhbGUgc2lnaHRpbmdzIHdpdGhpbiB0aGlzIGZvb3RwcmludCBjb21wYXJlZCB0byBleGlzdGluZyBzaGlwcGluZyBsYW5lcy4gU2lnaHRpbmdzIGFyZSByZWNvcmRlZCBieSB3aGFsZXdhdGNoaW5nIHZlc3NlbHMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ3aGFsZVNpZ2h0aW5nc1wiLGMscCwxKSxjLHAsMCwzMTYsNDgyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY291bnRcIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiY291bnRfdG90XCIsYyxwLDApKSk7Xy5iKFwiIChcIik7Xy5iKF8udihfLmYoXCJjb3VudF9wZXJjXCIsYyxwLDApKSk7Xy5iKFwiJSk8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBjbGFzcz1cXFwibW9yZVJlc3VsdHNcXFwiIGhyZWY9XFxcIiNcXFwiPm1vcmUgcmVzdWx0czwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1NDFhOWFiY2RhYzRjYWEwMjVhM2JhOFxcXCI+c2hvdyBlZmZvcnQgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+QmlvbG9naWNhbGx5IEltcG9ydGFudCBBcmVhcyA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+U3F1YXJlIG1pbGVzIG9mIGJpb2xvZ2ljYWxseSBpbXBvcnRhbnQgYXJlYXMgd2l0aGluIHRoaXMgZm9vdHByaW50LCBhcyB3ZWxsIGFzIHRoZSB0b3RhbCBwZXJjZW50YWdlIG9mIHRoZSBiaW9sb2dpY2FsbHkgaW1wb3J0YW50IGFyZWFzIHdpdGhpbiB0aGUgc3R1ZHkgYXJlYS48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNlbnNpdGl2ZVdoYWxlc1wiLGMscCwxKSxjLHAsMCw5NjYsMTU4MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJCbHVlXFxcIj5CbHVlIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5CYWxhZW5vcHRlcmEgbXVzY3VsdXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiQkxVRV9TUU1cIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiQkxVRV9UT1RcIixjLHAsMCkpKTtfLmIoXCIgc3EuIG1pLiA8c3Ryb25nPihcIik7Xy5iKF8udihfLmYoXCJCTFVFX1BFUkNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxsaSBjbGFzcz1cXFwiR3JheVxcXCI+R3JheSB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+RXNjaHJpY2h0aXVzIHJvYnVzdHVzPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcIkdSQVlfU1FNXCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcIkdSQVlfVE9UXCIsYyxwLDApKSk7Xy5iKFwiIHNxLiBtaS4gPHN0cm9uZz4oXCIpO18uYihfLnYoXy5mKFwiR1JBWV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiJSk8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgPGxpIGNsYXNzPVxcXCJIdW1wYmFja1xcXCI+SHVtcGJhY2sgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPk1lZ2FwdGVyYSBub3ZhZWFuZ2xpYWU8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiSFVNUF9TUU1cIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiSFVNUF9UT1RcIixjLHAsMCkpKTtfLmIoXCIgc3EuIG1pLiA8c3Ryb25nPihcIik7Xy5iKF8udihfLmYoXCJIVU1QX1BFUkNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPiAgXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInpvbmVPdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxOCw0MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8aDQ+QXR0cmlidXRlcyBmb3IgXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMjc4LDM4NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXHQgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoZSBzZWxlY3RlZCBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw1NjAsNTkzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJwcm9wb3NhbCBjb250YWlucyB6b25lcyB0aGF0IGFyZSBcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgem9uZSBpcyBcIik7fTtfLmIoXCIgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJ6b25lc2l6ZVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBzcXVhcmUgbWlsZXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ6b25lV2hhbGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNoYW5uZWwgSXNsYW5kcyBOYXR1cmFsaXN0IENvcnAgT2JzZXJ2YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx1bCBjbGFzcz1cXFwic2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwid2hhbGVTaWdodGluZ3NcIixjLHAsMSksYyxwLDAsMTQxLDMwNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxsaSBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+XCIpO18uYihfLnYoXy5mKFwic2NpZW50aWZpY05hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcImNvdW50X3RvdFwiLGMscCwwKSkpO18uYihcIiAoXCIpO18uYihfLnYoXy5mKFwiY291bnRfcGVyY1wiLGMscCwwKSkpO18uYihcIiUpPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgY2xhc3M9XFxcIm1vcmVSZXN1bHRzXFxcIiBocmVmPVxcXCIjXFxcIj5tb3JlIHJlc3VsdHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBzdHlsZT1cXFwiZmxvYXQ6cmlnaHQ7XFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NTQxYTlhYmNkYWM0Y2FhMDI1YTNiYThcXFwiPnNob3cgZWZmb3J0IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2xvZ2ljYWxseSBJbXBvcnRhbnQgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+U3F1YXJlIG1pbGVzIG9mIGJpb2xvZ2ljYWxseSBpbXBvcnRhbnQgYXJlYXMgd2l0aGluIHRoaXMgZm9vdHByaW50LCBhcyB3ZWxsIGFzIHRoZSB0b3RhbCBwZXJjZW50YWdlIG9mIHRoZSBiaW9sb2dpY2FsbHkgaW1wb3J0YW50IGFyZWFzIHdpdGhpbiB0aGUgc3R1ZHkgYXJlYS48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNlbnNpdGl2ZVdoYWxlc1wiLGMscCwxKSxjLHAsMCw3OTAsMTQwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJCbHVlXFxcIj5CbHVlIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5CYWxhZW5vcHRlcmEgbXVzY3VsdXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiQkxVRV9TUU1cIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiQkxVRV9UT1RcIixjLHAsMCkpKTtfLmIoXCIgc3EuIG1pLiA8c3Ryb25nPihcIik7Xy5iKF8udihfLmYoXCJCTFVFX1BFUkNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxsaSBjbGFzcz1cXFwiR3JheVxcXCI+R3JheSB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+RXNjaHJpY2h0aXVzIHJvYnVzdHVzPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPlwiKTtfLmIoXy52KF8uZihcIkdSQVlfU1FNXCIsYyxwLDApKSk7Xy5iKFwiIG9mIFwiKTtfLmIoXy52KF8uZihcIkdSQVlfVE9UXCIsYyxwLDApKSk7Xy5iKFwiIHNxLiBtaS4gPHN0cm9uZz4oXCIpO18uYihfLnYoXy5mKFwiR1JBWV9QRVJDXCIsYyxwLDApKSk7Xy5iKFwiJSk8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgPGxpIGNsYXNzPVxcXCJIdW1wYmFja1xcXCI+SHVtcGJhY2sgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPk1lZ2FwdGVyYSBub3ZhZWFuZ2xpYWU8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiSFVNUF9TUU1cIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiSFVNUF9UT1RcIixjLHAsMCkpKTtfLmIoXCIgc3EuIG1pLiA8c3Ryb25nPihcIik7Xy5iKF8udihfLmYoXCJIVU1QX1BFUkNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPiAgXCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
