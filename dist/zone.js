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

  WhalesTab.prototype.dependencies = ['SensitiveWhaleOverlap', 'WhaleOverlapTool'];

  WhalesTab.prototype.render = function() {
    var context, hasManagementAreas, hasNAs, hasOtherWhales, hasShippingLanes, mgmt_area_whales, other_whales, rec, sensitiveWhales, shipping_lane_whales, whaleSightings, whales_in_mgmt_areas, whales_in_other_areas, whales_in_shipping_lanes, _i, _j, _k, _len, _len1, _len2;
    window.results = this.results;
    sensitiveWhales = this.recordSet('SensitiveWhaleOverlap', 'SensitiveWhale').toArray();
    this.loadSensitiveWhaleData(sensitiveWhales);
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
      hasNAs: hasNAs
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"./ids.coffee":11,"./newSightingsTemplate.coffee":12,"reportTab":"a21iR2"}],14:[function(require,module,exports){
var WhalesTab, ZoneOverviewTab;

ZoneOverviewTab = require('./zoneOverviewTab.coffee');

WhalesTab = require('./whalesTab.coffee');

window.app.registerReport(function(report) {
  report.tabs([ZoneOverviewTab, WhalesTab]);
  return report.stylesheets(['./report.css']);
});


},{"./whalesTab.coffee":13,"./zoneOverviewTab.coffee":15}],15:[function(require,module,exports){
var ReportTab, ZoneOverviewTab, addCommas, key, partials, templates, val, _partials, _ref,
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

ZoneOverviewTab = (function(_super) {
  __extends(ZoneOverviewTab, _super);

  function ZoneOverviewTab() {
    this.onMoreResultsClick = __bind(this.onMoreResultsClick, this);
    _ref = ZoneOverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ZoneOverviewTab.prototype.name = 'Overview';

  ZoneOverviewTab.prototype.className = 'zoneOverview';

  ZoneOverviewTab.prototype.template = templates.zoneOverview;

  ZoneOverviewTab.prototype.events = {
    "click a[rel=toggle-layer]": '_handleReportLayerClick',
    "click a.moreResults": 'onMoreResultsClick'
  };

  ZoneOverviewTab.prototype.dependencies = ['ZoneSize'];

  ZoneOverviewTab.prototype.render = function() {
    var anyAttributes, attributes, context, isCollection, zonesize;
    window.results = this.results;
    isCollection = this.model.isCollection();
    attributes = this.model.getAttributes();
    console.log("attributes: ", attributes.attributesTable);
    anyAttributes = (attributes.length != null) > 0;
    zonesize = this.recordSet('ZoneSize', 'Size').float('SIZE_SQMI');
    context = {
      sketchClass: this.sketchClass.forTemplate(),
      zonesize: zonesize,
      attributes: attributes,
      anyAttributes: anyAttributes,
      isCollection: isCollection
    };
    this.$el.html(this.template.render(context, this.partials));
    return this.enableLayerTogglers(this.$el);
  };

  ZoneOverviewTab.prototype._handleReportLayerClick = function(e) {
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

  ZoneOverviewTab.prototype.onMoreResultsClick = function(e) {
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    return $(e.target).closest('.reportSection').removeClass('collapsed');
  };

  return ZoneOverviewTab;

})(ReportTab);

module.exports = ZoneOverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":16,"reportTab":"a21iR2"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["emissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!--");_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,128,546,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);if(_.s(_.f("noEmissionsChange",c,p,1),c,p,0,845,976,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"no_emissions_change\">");_.b("\n" + i);_.b("              <strong>No significant change</strong> in emissions.");_.b("\n" + i);_.b("          </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noEmissionsChange",c,p,1),c,p,1,0,0,"")){_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("co2EmissionsPercentChange",c,p,0)));_.b("</span>  emissions</p>");_.b("\n" + i);_.b("    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_co2_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1300,1302,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_co2_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1641,1643,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n" + i);_.b("    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,1981,1983,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("\n");};_.b("  <p><i>NOTE: These estimates should only be used for comparative purposes.  They are based on an average of container ships that transited the Santa Barbara Channel in 2013.  Estimates assume an average speed of 16 knots, and are compared to estimates for a transit via the designated IMO shipping lane.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("noxEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>NO<sub>x</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("noxEmissionsPercentChange",c,p,0)));_.b("</span> tons NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, NO<sub>x</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_nox_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,2910,2912,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_nox_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("pmEmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>PM<sub>10</sub> Emissions</h4>");_.b("\n" + i);_.b("    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("pmEmissionsPercentChange",c,p,0)));_.b("</span> tons PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("    <p>Assuming a speed of 16 knots, PM<sub>10</sub> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.f("new_pm_emissions",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,3610,3612,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("orig_pm_emissions",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("  <p><i>Note: Emissions numbers are based on averages and should only be used for comparative purposes.</i></p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"distance reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Length</h4>");_.b("\n" + i);if(_.s(_.f("noLengthChange",c,p,1),c,p,0,98,228,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"no_change\">");_.b("\n" + i);_.b("      <strong>No significant change</strong> in shipping lane length (of 158.35 miles).");_.b("\n" + i);_.b("    </div>");_.b("\n");});c.pop();}if(!_.s(_.f("noLengthChange",c,p,1),c,p,1,0,0,"")){_.b("  	<p class=\"lane_length\"><span class=\"measure\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  	<div class=\"length_diff\">");_.b("\n" + i);_.b("  		The new shipping lane is <strong>");_.b(_.v(_.f("length",c,p,0)));_.b("</strong> nautical miles, <strong>");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</strong> nautical miles");_.b("\n" + i);_.b("  		");if(_.s(_.f("lengthIncreased",c,p,1),c,p,0,518,524,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("longer");});c.pop();}if(!_.s(_.f("lengthIncreased",c,p,1),c,p,1,0,0,"")){_.b("shorter");};_.b(" than the original shipping lane.");_.b("\n" + i);_.b("  	</div>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("intersectsRig",c,p,1),c,p,0,683,959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"54ac50fd0e7f86cf7909abd2\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n");return _.fl();;});
this["Templates"]["proposalEmissions"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"emissions reportSection ");_.b(_.v(_.f("co2EmissionsChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Emissions</h4>");_.b("\n" + i);_.b("  	<div style=\"font-style:italic;\">");_.b("\n" + i);_.b("  		The following estimates are the result of changes in emissions based on changes to the shipping lane length and the introduction of Speed Reduction Zones:");_.b("\n" + i);_.b("  	</div>");_.b("\n" + i);if(_.s(_.f("emissionsReductions",c,p,1),c,p,0,321,2833,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  		<div class=\"in-report-header\">For shipping lane <div class=\"lane-name\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</div>, emission reductions are:</div>");_.b("\n" + i);_.b("	  		<div class=\"emissions-report\">");_.b("\n" + i);if(_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,0,505,694,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> CO<sub>2</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_CO2_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("		  			<div class=\"");_.b(_.v(_.f("CO2_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions \"><span class=\"measure\">");_.b(_.v(_.f("PERC_CO2",c,p,0)));_.b("</span> CO<sub>2</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>CO<sub>2</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_CO2",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,0,1059,1061,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("co2EmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_CO2",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,0,1282,1472,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	  				");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> NO<sub>x</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("				    </div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_NOX_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("NOX_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_NOX",c,p,0)));_.b("</span> NO<sub>x</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>NO<sub>x</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_NOX",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,0,1832,1834,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("noxEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("					    ");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_NOX",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("					</div>");_.b("\n");};if(_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,0,2056,2243,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("				 ");_.b("\n" + i);_.b("				    <div class=\"no_change\">");_.b("\n" + i);_.b("				    	<strong>No change</strong> in </span> PM<sub>10</sub> emissions of approximately <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>.");_.b("\n" + i);_.b("					</div>");_.b("\n" + i);_.b("					");_.b("\n");});c.pop();}if(!_.s(_.f("NO_PM10_CHANGE",c,p,1),c,p,1,0,0,"")){_.b("					<div class=\"");_.b(_.v(_.f("PM10_CHANGE_CLASS",c,p,0)));_.b("\">");_.b("\n" + i);_.b("					    <p class=\"summary_emissions\"><span class=\"measure\">");_.b(_.v(_.f("PERC_PM10",c,p,0)));_.b("</span> PM<sub>10</sub> emissions</p>");_.b("\n" + i);_.b("					    <p><strong>PM<sub>10</sub></strong> emissions for the new shipping lane are approximately ");_.b("\n" + i);_.b("					    <strong>");_.b(_.v(_.f("NEW_PM10",c,p,0)));_.b(" tons</strong>, ");if(_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,0,2609,2611,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("up");});c.pop();}if(!_.s(_.f("pmEmissionsIncreased",c,p,1),c,p,1,0,0,"")){_.b("down");_.b("\n" + i);_.b("				    	");};_.b(" from the previous emissions of <strong>");_.b(_.v(_.f("ORIG_PM10",c,p,0)));_.b(" tons</strong>.</p>");_.b("\n" + i);_.b("			    	</div>");_.b("\n");};_.b("	    	</div>");_.b("\n");});c.pop();}_.b("	  <p><i>NOTE: These estimates should only be used for comparative purposes.  They are based on an average of container ships that transited the Santa Barbara Channel in 2013.  Estimates assume an average speed of 16 knots, and are compared to estimates for a transit via the designated IMO shipping lane.</i></p>");_.b("\n" + i);_.b("\n" + i);_.b("  ");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["proposalOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Zone Sizes</h4>");_.b("\n" + i);if(_.s(_.f("zones",c,p,1),c,p,0,528,687,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The selected proposal contains <strong>");_.b(_.v(_.f("SC_ID",c,p,0)));_.b("</strong> sketches that total <strong>");_.b(_.v(_.f("SIZE_SQMI",c,p,0)));_.b("</strong> square miles.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Shipping Lane Lengths</h4>");_.b("\n" + i);if(_.s(_.f("lengths",c,p,1),c,p,0,790,928,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p class=\"large\">");_.b("\n" + i);_.b("  		The proposed shipping lane <strong>'");_.b(_.v(_.f("NAME",c,p,0)));_.b("'</strong> is <strong>");_.b(_.v(_.f("NEW_LENGTH",c,p,0)));_.b("</strong> miles long.");_.b("\n" + i);_.b("  	</p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["shippingLaneReport"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("intersectsRig",c,p,1),c,p,0,18,294,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection oilRig warning ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Oil Platform Intersection</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Your proposal overlaps the safety area around an oil platform!");_.b("\n" + i);_.b("    <br>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <a href=\"#\" data-toggle-node=\"51f2b455c96003dc13013e84\">show platforms</a>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Whale Sightings</h4>");_.b("\n" + i);_.b("  <p>Number of whale sightings within this footprint compared to existing shipping lanes. Sightings are recorded by whalewatching vessels.</p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,601,780,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span><span class=\"diff ");_.b(_.v(_.f("changeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("percentChange",c,p,0)));_.b("</span><span class=\"count\">");_.b(_.v(_.f("count",c,p,0)));_.b("</span></li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"51f2b455c96003dc13013e45\">show sightings layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"costs reportSection ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Distance and Fuel Costs</h4>");_.b("\n" + i);_.b("  <p>The new shipping lane has a length of <strong>");_.b(_.v(_.f("new_length",c,p,0)));_.b("</strong> miles.</p>");_.b("\n" + i);if(_.s(_.f("significantDistanceChange",c,p,1),c,p,0,1180,1598,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p class=\"summary\"><span class=\"measure\">");_.b(_.v(_.f("lengthPercentChange",c,p,0)));_.b("</span> each year for all transits</p>");_.b("\n" + i);_.b("  <div class=\"distance\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("lengthChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    change in length");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"fuel\">");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("tonsFuelChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in fuel consumption");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <div class=\"cost\">");_.b("\n" + i);_.b("    <span class=\"measure\">$");_.b(_.v(_.f("costChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("    in voyage costs");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("significantDistanceChange",c,p,1),c,p,1,0,0,"")){_.b("  <p class=\"summary\">No significant difference from existing configuration.</p>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection habitat ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <h4>Sensitive Blue Whale Habitat</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    <span class=\"measure\">");_.b(_.v(_.f("intersectedIsobathM",c,p,0)));_.b(" square meters of sensitive habitat disturbed.</span><span class=\"change ");_.b(_.v(_.f("isobathChangeClass",c,p,0)));_.b("\">");_.b(_.v(_.f("isobathPercentChange",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["whales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas (BIAs)");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"54dcd2ee9d2d9ba032e35b03\">show BIA layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      Total number of sq. miles of area identified as biologically important for feeding or migrating for part of the year that overlap with the footprint of the sketched plan.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,406,971,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings ");_.b(_.v(_.f("lengthChangeClass",c,p,0)));_.b(" collapsed\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corp Observations</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Total number of observations recorded in the footprint of this sketched plan by the Channel Islands Naturalist Corp upon whale watching vessels.  View the effort layer to assess whether this is an appropriate data set to use to compare plans of interest.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasManagementAreas",c,p,1),c,p,0,1425,1874,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Management Areas:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("mgmt_area_whales",c,p,1),c,p,0,1529,1838,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,1745,1809,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("    ");_.b("\n" + i);if(_.s(_.f("hasShippingLanes",c,p,1),c,p,0,1928,2405,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p><strong>In Shipping Lanes:</strong></p>");_.b("\n" + i);_.b("      <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("shipping_lane_whales",c,p,1),c,p,0,2038,2363,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("            <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2264,2332,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("        </li>");_.b("\n");});c.pop();}_.b("      </ul>");_.b("\n");});c.pop();}if(_.s(_.f("hasOtherWhales",c,p,1),c,p,0,2450,2907,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p><strong>In Other Sketch Types:</strong></p>");_.b("\n" + i);_.b("    <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("otherWhaleSightings",c,p,1),c,p,0,2559,2868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);if(!_.s(_.f("is_na",c,p,1),c,p,1,0,0,"")){_.b("          <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n");};if(_.s(_.f("is_na",c,p,1),c,p,0,2775,2839,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <span class=\"na_area\">N/A<sup>*</sup></span>");_.b("\n");});c.pop();}_.b("      </li>");_.b("\n");});c.pop();}_.b("    </ul>");_.b("\n");});c.pop();}_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasNAs",c,p,1),c,p,0,3042,3327,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p style=\"margin-top:30px;\"><sup>*</sup><i>Whale sighting counts are only applicable within the Channel Island Naturalist Corp Observation area. If at least 75% of a management area or shipping lane lies outside this region, the count values will be marked as N/A.</i>");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneOverview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("anyAttributes",c,p,1),c,p,0,18,437,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    	<h4>Attributes for ");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" </h4>");_.b("\n" + i);_.b("	    <table>");_.b("\n" + i);_.b("	      <thead>");_.b("\n" + i);_.b("	        <tr>");_.b("\n" + i);_.b("	          <th>Name</th>");_.b("\n" + i);_.b("	          <th>Value</th>");_.b("\n" + i);_.b("	        </tr>");_.b("\n" + i);_.b("	      </thead>");_.b("\n" + i);_.b("	    <tbody>");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,278,384,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	          <tr>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	            <td>");_.b(_.v(_.f("value",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("	          </tr>");_.b("\n");});c.pop();}_.b("	    </tbody>");_.b("\n" + i);_.b("    	</table>");_.b("\n" + i);_.b("  </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"distance reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  	<p class=\"large\">The selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,560,593,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("proposal contains zones that are ");});c.pop();}_.b("\n" + i);_.b("  		");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b(" zone is ");};_.b(" <strong>");_.b(_.v(_.f("zonesize",c,p,0)));_.b("</strong> square miles.</p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["zoneWhales"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Biologically Important Areas (BIAs)");_.b("\n" + i);_.b("    <a href=\"#\" style=\"float:right;\" data-toggle-node=\"54dcd2ee9d2d9ba032e35b03\">show BIA layers</a>");_.b("\n" + i);_.b("  </h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      Total number of sq. miles of area identified as biologically important for feeding or migrating for part of the year that overlap with the footprint of the sketched plan.");_.b("\n" + i);_.b("    </p>");_.b("\n" + i);if(_.s(_.f("sensitiveWhales",c,p,1),c,p,0,406,1611,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <p><strong>In ");_.b(_.v(_.f("SC_NAME",c,p,0)));_.b("s:</strong></p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);_.b("    ");_.b("\n" + i);_.b("      <!--");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("BLUE_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("BLUE_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("GRAY_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("GRAY_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b(" of ");_.b(_.v(_.f("HUMP_TOT",c,p,0)));_.b(" sq. mi. <strong>(");_.b(_.v(_.f("HUMP_PERC",c,p,0)));_.b("%)</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("      -->");_.b("\n" + i);_.b("      <li class=\"Blue\">Blue whales <span class=\"sci\">Balaenoptera musculus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("BLUE_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("      <li class=\"Gray\">Gray whales <span class=\"sci\">Eschrichtius robustus</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("GRAY_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>");_.b("\n" + i);_.b("       <li class=\"Humpback\">Humpback whales <span class=\"sci\">Megaptera novaeangliae</span>");_.b("\n" + i);_.b("        <span class=\"area\"><strong>");_.b(_.v(_.f("HUMP_SQM",c,p,0)));_.b("</strong></span>");_.b("\n" + i);_.b("      </li>  ");_.b("\n" + i);_.b("    ");_.b("\n" + i);_.b("  </ul>");_.b("\n");});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection sightings\">");_.b("\n" + i);_.b("  <h4>Channel Islands Naturalist Corps Observations</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    Total number of observations recorded in the footprint of this sketched plan by the Channel Islands Naturalist Corp upon whale watching vessels.  View the effort layer to assess wether this is an appropriate data set to use to compare plans of interest.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("  <ul class=\"sightings\">");_.b("\n" + i);if(_.s(_.f("whaleSightings",c,p,1),c,p,0,2054,2228,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <li class=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">");_.b(_.v(_.f("name",c,p,0)));_.b(" <span class=\"sci\">");_.b(_.v(_.f("scientificName",c,p,0)));_.b("</span>");_.b("\n" + i);_.b("        <span class=\"area\">");_.b(_.v(_.f("count",c,p,0)));_.b(" of ");_.b(_.v(_.f("count_tot",c,p,0)));_.b(" (");_.b(_.v(_.f("count_perc",c,p,0)));_.b("%)</span>");_.b("\n" + i);_.b("      </li>");_.b("\n");});c.pop();}_.b("  </ul>");_.b("\n" + i);_.b("  <a class=\"moreResults\" href=\"#\">more results</a>");_.b("\n" + i);_.b("  <a href=\"#\" style=\"float:right;\" data-toggle-node=\"5541a9abcdac4caa025a3ba8\">show effort layer</a>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvc2FmZS1wYXNzYWdlcy1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9pZHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy9uZXdTaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3doYWxlc1RhYi5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL3NhZmUtcGFzc2FnZXMtcmVwb3J0cy9zY3JpcHRzL3pvbmUuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvc2NyaXB0cy96b25lT3ZlcnZpZXdUYWIuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9zYWZlLXBhc3NhZ2VzLXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBLENBQU8sQ0FBVSxDQUFBLEdBQVgsQ0FBTixFQUFrQjtDQUNoQixLQUFBLDJFQUFBO0NBQUEsQ0FBQSxDQUFBO0NBQUEsQ0FDQSxDQUFBLEdBQVk7Q0FEWixDQUVBLENBQUEsR0FBTTtBQUNDLENBQVAsQ0FBQSxDQUFBLENBQUE7Q0FDRSxFQUFBLENBQUEsR0FBTyxxQkFBUDtDQUNBLFNBQUE7SUFMRjtDQUFBLENBTUEsQ0FBVyxDQUFBLElBQVgsYUFBVztDQUVYO0NBQUEsTUFBQSxvQ0FBQTt3QkFBQTtDQUNFLEVBQVcsQ0FBWCxHQUFXLENBQVg7Q0FBQSxFQUNT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S0FBQSxDQUFBLElBQUEsS0FBQTtDQXZDRixFQXFDb0I7O0NBckNwQjs7Q0FENEI7O0FBMEM5QixDQTVEQSxFQTREaUIsR0FBWCxDQUFOLFFBNURBOzs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjb25zb2xlLmxvZyBAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpXG4gICAgICAgICAgcGF5bG9hZFNpemUgPSBNYXRoLnJvdW5kKCgoQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKSBvciAwKSAvIDEwMjQpICogMTAwKSAvIDEwMFxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiRmVhdHVyZVNldCBzZW50IHRvIEdQIHdlaWdoZWQgaW4gYXQgI3twYXlsb2FkU2l6ZX1rYlwiXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChAbWF4RXRhICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7QG1heEV0YSArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YVNlY29uZHMnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwibW9kdWxlLmV4cG9ydHMgPSBcbiAgU0hJUFBJTkdfTEFORV9JRDogXCI1NGQyYThhZmZhOTRlNjk3NzU5Y2JjNzlcIlxuICBNR01UX0FSRUFfSUQ6IFwiNTUyMzA4MzliNDNhM2FkNDI4NDRkNDEwXCJcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICB7XG4gICAgaWQ6ICdCbHVlJ1xuICAgIG5hbWU6ICdCbHVlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIG11c2N1bHVzJ1xuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiA2MDk0XG4gICAgY291bnRfcGVyYzogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdIdW1wYmFjaydcbiAgICBuYW1lOiAnSHVtcGJhY2sgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdNZWdhcHRlcmEgbm92YWVhbmdsaWFlJ1xuICAgIHVuY2hhbmdlZENvdW50OiA4NTU0XG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDg1NTRcbiAgICBjb3VudF9wZXJjOiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ0dyYXknXG4gICAgbmFtZTogJ0dyYXkgV2hhbGUnXG4gICAgc2NpZW50aWZpY05hbWU6ICdFc2NocmljaHRpdXMgcm9idXN0dXMnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDEwMzM5XG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDEwMzM5XG4gICAgY291bnRfcGVyYzogMFxuICB9LFxuICB7XG4gICAgaWQ6ICdGaW4nXG4gICAgbmFtZTogJ0ZpbiBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0JhbGFlbm9wdGVyYSBwaHlzYWx1cydcbiAgICB1bmNoYW5nZWRDb3VudDogMTIxXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDEyMVxuICAgIGNvdW50X3BlcmM6IDBcbiAgfSxcbiAge1xuICAgIGlkOiAnTWlua2UnXG4gICAgbmFtZTogJ01pbmtlIFdoYWxlJ1xuICAgIHNjaWVudGlmaWNOYW1lOiAnQmFsYWVub3B0ZXJhIGFjdXRvcm9zdHJhdGEnXG4gICAgdW5jaGFuZ2VkQ291bnQ6IDM4NVxuICAgIGNvdW50OiAwXG4gICAgY291bnRfdG90OiAzODVcbiAgICBjb3VudF9wZXJjOiAwXG4gIH0sXG4gIHtcbiAgICBpZDogJ1BpbG90IFdoYWxlJ1xuICAgIG5hbWU6ICdQaWxvdCBXaGFsZSdcbiAgICBzY2llbnRpZmljTmFtZTogJ0dsb2JpY2VwaGFsYSBtYWNyb3JoeW5jaHVzJ1xuICAgIHVuY2hhbmdlZENvdW50OiAzXG4gICAgY291bnQ6IDBcbiAgICBjb3VudF90b3Q6IDNcbiAgICBjb3VudF9wZXJjOiAwXG4gIH1cbl1cblxuXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuc2lnaHRpbmdzVGVtcGxhdGUgPSByZXF1aXJlICcuL25ld1NpZ2h0aW5nc1RlbXBsYXRlLmNvZmZlZSdcblxuXG5pZHMgPSByZXF1aXJlICcuL2lkcy5jb2ZmZWUnXG5cbmZvciBrZXksIHZhbHVlIG9mIGlkc1xuICB3aW5kb3dba2V5XSA9IHZhbHVlXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgV2hhbGVzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdXaGFsZXMnXG4gIGNsYXNzTmFtZTogJ3doYWxlcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy53aGFsZXNcbiAgZXZlbnRzOlxuICAgIFwiY2xpY2sgYVtyZWw9dG9nZ2xlLWxheWVyXVwiIDogJ19oYW5kbGVSZXBvcnRMYXllckNsaWNrJ1xuICAgIFwiY2xpY2sgYS5tb3JlUmVzdWx0c1wiOiAgICAgICAgJ29uTW9yZVJlc3VsdHNDbGljaydcbiAgZGVwZW5kZW5jaWVzOiBbJ1NlbnNpdGl2ZVdoYWxlT3ZlcmxhcCcsICdXaGFsZU92ZXJsYXBUb29sJ11cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG4gICAgc2Vuc2l0aXZlV2hhbGVzID0gQHJlY29yZFNldCgnU2Vuc2l0aXZlV2hhbGVPdmVybGFwJywgJ1NlbnNpdGl2ZVdoYWxlJykudG9BcnJheSgpXG4gICAgQGxvYWRTZW5zaXRpdmVXaGFsZURhdGEgc2Vuc2l0aXZlV2hhbGVzXG4gICAgd2hhbGVTaWdodGluZ3MgPSBAcmVjb3JkU2V0KCdXaGFsZU92ZXJsYXBUb29sJywgJ1doYWxlQ291bnQnKS50b0FycmF5KClcbiAgICBoYXNOQXMgPSBmYWxzZVxuXG4gICAgd2hhbGVzX2luX21nbXRfYXJlYXMgPSBfLmZpbHRlciB3aGFsZVNpZ2h0aW5ncywgKHJvdykgLT4gcm93LlNDX0lEID09IE1HTVRfQVJFQV9JRCAgICAgXG4gICAgaGFzTWFuYWdlbWVudEFyZWFzID0gd2hhbGVzX2luX21nbXRfYXJlYXM/Lmxlbmd0aCA+IDBcbiAgICBtZ210X2FyZWFfd2hhbGVzID0gXy5tYXAgc2lnaHRpbmdzVGVtcGxhdGUsIChzKSAtPiBfLmNsb25lKHMpXG4gICAgQGxvYWRTaWdodGluZ3NEYXRhIG1nbXRfYXJlYV93aGFsZXMsIHdoYWxlc19pbl9tZ210X2FyZWFzXG4gICAgZm9yIHJlYyBpbiBtZ210X2FyZWFfd2hhbGVzXG4gICAgICBpZiByZWMuaXNfbmFcbiAgICAgICAgaGFzTkFzID0gdHJ1ZVxuICAgICAgICBicmVha1xuXG4gICAgd2hhbGVzX2luX3NoaXBwaW5nX2xhbmVzID0gXy5maWx0ZXIgd2hhbGVTaWdodGluZ3MsIChyb3cpIC0+IChyb3cuU0NfSUQgPT0gU0hJUFBJTkdfTEFORV9JRClcbiAgICBoYXNTaGlwcGluZ0xhbmVzID0gd2hhbGVzX2luX3NoaXBwaW5nX2xhbmVzPy5sZW5ndGggPiAwXG4gICAgc2hpcHBpbmdfbGFuZV93aGFsZXMgPSBfLm1hcCBzaWdodGluZ3NUZW1wbGF0ZSwgKHMpIC0+IF8uY2xvbmUocylcbiAgICBAbG9hZFNpZ2h0aW5nc0RhdGEgc2hpcHBpbmdfbGFuZV93aGFsZXMsIHdoYWxlc19pbl9zaGlwcGluZ19sYW5lc1xuICAgIGlmICFoYXNOQXNcbiAgICAgIGZvciByZWMgaW4gc2hpcHBpbmdfbGFuZV93aGFsZXNcbiAgICAgICAgaWYgcmVjLmlzX25hXG4gICAgICAgICAgaGFzTkFzID0gdHJ1ZVxuICAgICAgICAgIGJyZWFrXG5cbiAgICB3aGFsZXNfaW5fb3RoZXJfYXJlYXMgPSBfLmZpbHRlciB3aGFsZVNpZ2h0aW5ncywgKHJvdykgLT4gKHJvdy5TQ19JRCAhPSBTSElQUElOR19MQU5FX0lEICYmIHJvdy5TQ19JRCAhPSBNR01UX0FSRUFfSUQpXG4gICAgaGFzT3RoZXJXaGFsZXM9IHdoYWxlc19pbl9vdGhlcl9hcmVhcz8ubGVuZ3RoID4gMFxuICAgIG90aGVyX3doYWxlcyA9IF8ubWFwIHNpZ2h0aW5nc1RlbXBsYXRlLCAocykgLT4gXy5jbG9uZShzKVxuICAgIEBsb2FkU2lnaHRpbmdzRGF0YSBvdGhlcl93aGFsZXMsIHdoYWxlc19pbl9vdGhlcl9hcmVhc1xuICAgIGlmICFoYXNOQXNcbiAgICAgIGZvciByZWMgaW4gb3RoZXJfd2hhbGVzXG4gICAgICAgIGlmIHJlYy5pc19uYVxuICAgICAgICAgIGhhc05BcyA9IHRydWVcbiAgICAgICAgICBicmVha1xuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2hDbGFzczogQGFwcC5za2V0Y2hDbGFzc2VzLmdldChAbW9kZWwuZ2V0ICdza2V0Y2hjbGFzcycpLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcblxuICAgICAgbWdtdF9hcmVhX3doYWxlczogbWdtdF9hcmVhX3doYWxlc1xuICAgICAgc2hpcHBpbmdfbGFuZV93aGFsZXM6IHNoaXBwaW5nX2xhbmVfd2hhbGVzXG4gICAgICBvdGhlcl93aGFsZXM6IG90aGVyX3doYWxlc1xuXG4gICAgICBoYXNNYW5hZ2VtZW50QXJlYXM6IGhhc01hbmFnZW1lbnRBcmVhc1xuICAgICAgaGFzU2hpcHBpbmdMYW5lczogaGFzU2hpcHBpbmdMYW5lc1xuICAgICAgaGFzT3RoZXJXaGFsZXM6IGhhc090aGVyV2hhbGVzXG5cbiAgICAgIHNlbnNpdGl2ZVdoYWxlczogc2Vuc2l0aXZlV2hhbGVzXG4gICAgICBoYXNOQXM6IGhhc05Bc1xuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIgY29udGV4dCwgQHBhcnRpYWxzXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuXG4gIGdldF93aGFsZV9zcGVjaWVzOiAoY29tbW9uX25hbWUpIC0+XG4gICAgbWFwcGluZyA9IHsnQmx1ZSc6J0JhbGFlbm9wdGVyYSBtdXNjdWx1cycsICdIdW1wYmFjayc6J01lZ2FwdGVyYSBub3ZhZWFuZ2xpYWUnLCdHcmF5JzonRXNjaHJpY2h0aXVzIHJvYnVzdHVzJywnRmluJzonQmFsYWVub3B0ZXJhIHBoeXNhbHVzJywnTWlua2UnOidCYWxhZW5vcHRlcmEgYWN1dG9yb3N0cmF0YScsJ1BpbG90IFdoYWxlJzonR2xvYmljZXBoYWxhIG1hY3Jvcmh5bmNodXMnfVxuICAgIHJldHVybiBtYXBwaW5nW2NvbW1vbl9uYW1lXVxuICBcbiAgZ2V0X3doYWxlX25hbWU6IChjb21tb25fbmFtZSkgLT5cbiAgICBtYXBwaW5nID0geydCbHVlJzonQmx1ZSBXaGFsZScsICdIdW1wYmFjayc6J0h1bXBiYWNrIFdoYWxlJywnR3JheSc6J0dyYXkgV2hhbGUnLCdGaW4nOidGaW4gV2hhbGUnLCdNaW5rZSc6J01pbmtlIFdoYWxlJywnUGlsb3QgV2hhbGUnOidQaWxvdCBXaGFsZSd9XG4gICAgcmV0dXJuIG1hcHBpbmdbY29tbW9uX25hbWVdXG5cbiAgZ2V0X2ZvdW5kX3doYWxlOiAoaWQsIGZvdW5kX2RhdGEpIC0+XG4gICAgZm9yIGZkIGluIGZvdW5kX2RhdGFcbiAgICAgIGlmIGZkLlNwZWNpZXMgPT0gaWRcbiAgICAgICAgcmV0dXJuIGZkXG4gICAgcmV0dXJuIG51bGxcblxuICBpc19uYTogKGRhdGEpIC0+XG4gICAgZm9yIHJlY29yZCBpbiBkYXRhXG4gICAgICBpZiByZWNvcmQuRlJFUVVFTkNZID09IFwiTi9BXCJcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2VcblxuICBsb2FkU2lnaHRpbmdzRGF0YTogKGZ1bGxfZGF0YSwgZm91bmRfZGF0YSkgLT5cbiAgICBpZiBAaXNfbmEoZm91bmRfZGF0YSlcbiAgICAgIGZvciByZWNvcmQgaW4gZnVsbF9kYXRhXG4gICAgICAgIHJlY29yZC5pc19uYSA9IFwiTi9BXCJcbiAgICBlbHNlXG4gICAgICBmb3IgcmVjb3JkIGluIGZ1bGxfZGF0YVxuICAgICAgICBmZCA9IEBnZXRfZm91bmRfd2hhbGUocmVjb3JkLmlkLCBmb3VuZF9kYXRhKVxuICAgICAgICBpZiBmZCAhPSBudWxsXG4gICAgICAgICAgcmVjb3JkLmNvdW50X3BlcmMgPSBmZC5jb3VudF9wZXJjXG4gICAgICAgICAgcmVjb3JkLmNvdW50X3RvdCA9IGZkLmNvdW50X3RvdFxuXG4gICAgICAgICAgcmVjb3JkLmNvdW50ID0gZmQuRlJFUVVFTkNZXG5cbiAgbG9hZFNlbnNpdGl2ZVdoYWxlRGF0YTogKGRhdGEpIC0+XG4gICAgZm9yIHN3IGluIGRhdGFcbiAgICAgIHNjX2lkID0gc3cuU0NfSURcbiAgICAgIHNjZCA9IEBhcHAuc2tldGNoQ2xhc3Nlcy5nZXQoc2NfaWQpXG4gICAgICBzdy5TQ19OQU1FID0gc2NkLmF0dHJpYnV0ZXMubmFtZVxuICAgICAgc3cuQkxVRV9UT1QgPSAyODA5XG4gICAgICBzdy5CTFVFX1NRTSA9IE1hdGgucm91bmQoc3cuQkxVRV9TUU0pK1wiIHNxLiBtaS5cIlxuICAgICAgc3cuR1JBWV9UT1QgPSA1MDY2N1xuICAgICAgc3cuR1JBWV9TUU0gPSBNYXRoLnJvdW5kKHN3LkdSQVlfU1FNKStcIiBzcS4gbWkuXCJcbiAgICAgIHN3LkhVTVBfVE9UID0gMTI2N1xuICAgICAgc3cuSFVNUF9TUU0gPSBNYXRoLnJvdW5kKHN3LkhVTVBfU1FNKStcIiBzcS4gbWkuXCJcbiAgICBcbiAgICByZXR1cm4gZGF0YVxuXG4gIF9oYW5kbGVSZXBvcnRMYXllckNsaWNrOiAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICB1cmwgPSAkKGUudGFyZ2V0KS5hdHRyKCdocmVmJylcbiAgICBub2RlID0gd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UuZGF0YVNpZGViYXIubGF5ZXJUcmVlLmdldE5vZGVCeVVybCB1cmxcbiAgICBub2RlPy5tYWtlVmlzaWJsZSgpXG4gICAgbm9kZT8ubWFrZUFsbFZpc2libGVCZWxvdygpXG4gICAgbm9kZT8udXBkYXRlTWFwKClcbiAgICBmYWxzZVxuXG4gIG9uTW9yZVJlc3VsdHNDbGljazogKGUpID0+XG4gICAgZT8ucHJldmVudERlZmF1bHQ/KClcbiAgICAkKGUudGFyZ2V0KS5jbG9zZXN0KCcucmVwb3J0U2VjdGlvbicpLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG5cbm1vZHVsZS5leHBvcnRzID0gV2hhbGVzVGFiIiwiWm9uZU92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi96b25lT3ZlcnZpZXdUYWIuY29mZmVlJ1xuV2hhbGVzVGFiID0gcmVxdWlyZSAnLi93aGFsZXNUYWIuY29mZmVlJ1xud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbWm9uZU92ZXJ2aWV3VGFiLCBXaGFsZXNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuI3NpZ2h0aW5nc1RlbXBsYXRlID0gcmVxdWlyZSAnLi9zaWdodGluZ3NUZW1wbGF0ZS5jb2ZmZWUnXG5cbmFkZENvbW1hcyA9IChuU3RyKSAtPlxuICBuU3RyICs9ICcnXG4gIHggPSBuU3RyLnNwbGl0KCcuJylcbiAgeDEgPSB4WzBdXG4gIHgyID0gaWYgeC5sZW5ndGggPiAxIHRoZW4gJy4nICsgeFsxXSBlbHNlICcnXG4gIHJneCA9IC8oXFxkKykoXFxkezN9KS9cbiAgd2hpbGUgKHJneC50ZXN0KHgxKSlcbiAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgJywnICsgJyQyJylcbiAgcmV0dXJuIHgxICsgeDJcblxuY2xhc3MgWm9uZU92ZXJ2aWV3VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdPdmVydmlldydcbiAgY2xhc3NOYW1lOiAnem9uZU92ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLnpvbmVPdmVydmlld1xuICBldmVudHM6XG4gICAgXCJjbGljayBhW3JlbD10b2dnbGUtbGF5ZXJdXCIgOiAnX2hhbmRsZVJlcG9ydExheWVyQ2xpY2snXG4gICAgXCJjbGljayBhLm1vcmVSZXN1bHRzXCI6ICAgICAgICAnb25Nb3JlUmVzdWx0c0NsaWNrJ1xuICBkZXBlbmRlbmNpZXM6IFsnWm9uZVNpemUnXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB3aW5kb3cucmVzdWx0cyA9IEByZXN1bHRzXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgYXR0cmlidXRlcyA9IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICBjb25zb2xlLmxvZyhcImF0dHJpYnV0ZXM6IFwiLCBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXNUYWJsZSlcbiAgICBhbnlBdHRyaWJ1dGVzID0gYXR0cmlidXRlcy5sZW5ndGg/ID4gMFxuICAgIHpvbmVzaXplID0gQHJlY29yZFNldCgnWm9uZVNpemUnLCAnU2l6ZScpLmZsb2F0KCdTSVpFX1NRTUknKVxuXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIHpvbmVzaXplOiB6b25lc2l6ZSBcbiAgICAgIGF0dHJpYnV0ZXM6YXR0cmlidXRlc1xuICAgICAgYW55QXR0cmlidXRlczogYW55QXR0cmlidXRlc1xuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyIGNvbnRleHQsIEBwYXJ0aWFsc1xuXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICAgICMgU2hvdWxkbid0IHdlIGdpdmUgc29tZSBmZWVkYmFjayB0byB0aGUgdXNlciBpZiB0aGUgbGF5ZXIgaXNuJ3QgcHJlc2VudCBpbiB0aGUgbGF5ZXIgdHJlZT9cbiAgX2hhbmRsZVJlcG9ydExheWVyQ2xpY2s6IChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHVybCA9ICQoZS50YXJnZXQpLmF0dHIoJ2hyZWYnKVxuICAgIG5vZGUgPSB3aW5kb3cuYXBwLnByb2plY3Rob21lcGFnZS5kYXRhU2lkZWJhci5sYXllclRyZWUuZ2V0Tm9kZUJ5VXJsIHVybFxuICAgIG5vZGU/Lm1ha2VWaXNpYmxlKClcbiAgICBub2RlPy5tYWtlQWxsVmlzaWJsZUJlbG93KClcbiAgICBub2RlPy51cGRhdGVNYXAoKVxuICAgIGZhbHNlXG5cbiAgb25Nb3JlUmVzdWx0c0NsaWNrOiAoZSkgPT5cbiAgICBlPy5wcmV2ZW50RGVmYXVsdD8oKVxuICAgICQoZS50YXJnZXQpLmNsb3Nlc3QoJy5yZXBvcnRTZWN0aW9uJykucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcblxubW9kdWxlLmV4cG9ydHMgPSBab25lT3ZlcnZpZXdUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImNvc3RzIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGFuZCBGdWVsIENvc3RzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2lnbmlmaWNhbnREaXN0YW5jZUNoYW5nZVwiLGMscCwxKSxjLHAsMCwxMjgsNTQ2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gZWFjaCB5ZWFyIGZvciBhbGwgdHJhbnNpdHM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNoYW5nZSBpbiBsZW5ndGhcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZnVlbFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJ0b25zRnVlbENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gZnVlbCBjb25zdW1wdGlvblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJjb3N0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPiRcIik7Xy5iKF8udihfLmYoXCJjb3N0Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiB2b3lhZ2UgY29zdHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+Tm8gc2lnbmlmaWNhbnQgZGlmZmVyZW5jZSBmcm9tIGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDAsODQ1LDk3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIm5vX2VtaXNzaW9uc19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHN0cm9uZz5ObyBzaWduaWZpY2FudCBjaGFuZ2U8L3N0cm9uZz4gaW4gZW1pc3Npb25zLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9FbWlzc2lvbnNDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY28yRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gIGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+PHN0cm9uZz5DTzxzdWI+Mjwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfY28yX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwxMzAwLDEzMDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiY28yRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19jbzJfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X25veF9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTY0MSwxNjQzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD48c3Ryb25nPlBNPHN1Yj4xMDwvc3ViPjwvc3Ryb25nPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTk4MSwxOTgzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19wbV9lbWlzc2lvbnNcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwibm94RW1pc3Npb25zQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk5PPHN1Yj54PC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5veEVtaXNzaW9uc1BlcmNlbnRDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IHRvbnMgTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBOTzxzdWI+eDwvc3ViPiBlbWlzc2lvbnMgZm9yIHRoZSBuZXcgc2hpcHBpbmcgbGFuZSBhcmUgYXBwcm94aW1hdGVseSBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJuZXdfbm94X2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMCwyOTEwLDI5MTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInVwXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm94RW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcIik7fTtfLmIoXCIgZnJvbSB0aGUgcHJldmlvdXMgZW1pc3Npb25zIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwib3JpZ19ub3hfZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZW1pc3Npb25zIHJlcG9ydFNlY3Rpb24gXCIpO18uYihfLnYoXy5mKFwicG1FbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UE08c3ViPjEwPC9zdWI+IEVtaXNzaW9uczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5X2VtaXNzaW9uc1xcXCI+PHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcInBtRW1pc3Npb25zUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gdG9ucyBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5Bc3N1bWluZyBhIHNwZWVkIG9mIDE2IGtub3RzLCBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X3BtX2VtaXNzaW9uc1wiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LCBcIik7aWYoXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwwLDM2MTAsMzYxMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidXBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJwbUVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm9yaWdfcG1fZW1pc3Npb25zXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+PGk+Tm90ZTogRW1pc3Npb25zIG51bWJlcnMgYXJlIGJhc2VkIG9uIGF2ZXJhZ2VzIGFuZCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBjb21wYXJhdGl2ZSBwdXJwb3Nlcy48L2k+PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIi0tPlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZSByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5MZW5ndGg8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJub0xlbmd0aENoYW5nZVwiLGMscCwxKSxjLHAsMCw5OCwyMjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxzdHJvbmc+Tm8gc2lnbmlmaWNhbnQgY2hhbmdlPC9zdHJvbmc+IGluIHNoaXBwaW5nIGxhbmUgbGVuZ3RoIChvZiAxNTguMzUgbWlsZXMpLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibm9MZW5ndGhDaGFuZ2VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIFx0PHAgY2xhc3M9XFxcImxhbmVfbGVuZ3RoXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBjbGFzcz1cXFwibGVuZ3RoX2RpZmZcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBuZXcgc2hpcHBpbmcgbGFuZSBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImxlbmd0aFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBuYXV0aWNhbCBtaWxlcywgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gbmF1dGljYWwgbWlsZXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcIik7aWYoXy5zKF8uZihcImxlbmd0aEluY3JlYXNlZFwiLGMscCwxKSxjLHAsMCw1MTgsNTI0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJsb25nZXJcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJsZW5ndGhJbmNyZWFzZWRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzaG9ydGVyXCIpO307Xy5iKFwiIHRoYW4gdGhlIG9yaWdpbmFsIHNoaXBwaW5nIGxhbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpbnRlcnNlY3RzUmlnXCIsYyxwLDEpLGMscCwwLDY4Myw5NTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gb2lsUmlnIHdhcm5pbmcgXCIpO18uYihfLnYoXy5mKFwibGVuZ3RoQ2hhbmdlQ2xhc3NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk9pbCBQbGF0Zm9ybSBJbnRlcnNlY3Rpb248L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFlvdXIgcHJvcG9zYWwgb3ZlcmxhcHMgdGhlIHNhZmV0eSBhcmVhIGFyb3VuZCBhbiBvaWwgcGxhdGZvcm0hXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxicj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0YWM1MGZkMGU3Zjg2Y2Y3OTA5YWJkMlxcXCI+c2hvdyBwbGF0Zm9ybXM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wicHJvcG9zYWxFbWlzc2lvbnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMgcmVwb3J0U2VjdGlvbiBcIik7Xy5iKF8udihfLmYoXCJjbzJFbWlzc2lvbnNDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RW1pc3Npb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBzdHlsZT1cXFwiZm9udC1zdHlsZTppdGFsaWM7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRUaGUgZm9sbG93aW5nIGVzdGltYXRlcyBhcmUgdGhlIHJlc3VsdCBvZiBjaGFuZ2VzIGluIGVtaXNzaW9ucyBiYXNlZCBvbiBjaGFuZ2VzIHRvIHRoZSBzaGlwcGluZyBsYW5lIGxlbmd0aCBhbmQgdGhlIGludHJvZHVjdGlvbiBvZiBTcGVlZCBSZWR1Y3Rpb24gWm9uZXM6XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJlbWlzc2lvbnNSZWR1Y3Rpb25zXCIsYyxwLDEpLGMscCwwLDMyMSwyODMzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkZvciBzaGlwcGluZyBsYW5lIDxkaXYgY2xhc3M9XFxcImxhbmUtbmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvZGl2PiwgZW1pc3Npb24gcmVkdWN0aW9ucyBhcmU6PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0XHQ8ZGl2IGNsYXNzPVxcXCJlbWlzc2lvbnMtcmVwb3J0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTk9fQ08yX0NIQU5HRVwiLGMscCwxKSxjLHAsMCw1MDUsNjk0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgXHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICA8ZGl2IGNsYXNzPVxcXCJub19jaGFuZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0PHN0cm9uZz5ObyBjaGFuZ2U8L3N0cm9uZz4gaW4gPC9zcGFuPiBDTzxzdWI+Mjwvc3ViPiBlbWlzc2lvbnMgb2YgYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19DTzJcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19DTzJfQ0hBTkdFXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiXHRcdCAgXHRcdFx0PGRpdiBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiQ08yX0NIQU5HRV9DTEFTU1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8cCBjbGFzcz1cXFwic3VtbWFyeV9lbWlzc2lvbnMgXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19DTzJcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IENPPHN1Yj4yPC9zdWI+IGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwPjxzdHJvbmc+Q088c3ViPjI8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19DTzJcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJjbzJFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTA1OSwxMDYxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImNvMkVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX0NPMlwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJOT19OT1hfQ0hBTkdFXCIsYyxwLDEpLGMscCwwLDEyODIsMTQ3MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgIFx0XHRcdFx0XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPGRpdiBjbGFzcz1cXFwibm9fY2hhbmdlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdCAgICBcdDxzdHJvbmc+Tm8gY2hhbmdlPC9zdHJvbmc+IGluIDwvc3Bhbj4gTk88c3ViPng8L3N1Yj4gZW1pc3Npb25zIG9mIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfTk9YXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdFwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19OT1hfQ0hBTkdFXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiXHRcdFx0XHRcdDxkaXYgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcIk5PWF9DSEFOR0VfQ0xBU1NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19OT1hcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+IE5PPHN1Yj54PC9zdWI+IGVtaXNzaW9uczwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIDxwPjxzdHJvbmc+Tk88c3ViPng8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19OT1hcIixjLHAsMCkpKTtfLmIoXCIgdG9uczwvc3Ryb25nPiwgXCIpO2lmKF8ucyhfLmYoXCJub3hFbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMTgzMiwxODM0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm5veEVtaXNzaW9uc0luY3JlYXNlZFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvd25cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0ICAgIFwiKTt9O18uYihcIiBmcm9tIHRoZSBwcmV2aW91cyBlbWlzc2lvbnMgb2YgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJPUklHX05PWFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHRcdFx0PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJOT19QTTEwX0NIQU5HRVwiLGMscCwxKSxjLHAsMCwyMDU2LDIyNDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIlx0XHRcdFx0IFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIDxkaXYgY2xhc3M9XFxcIm5vX2NoYW5nZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHQgICAgXHQ8c3Ryb25nPk5vIGNoYW5nZTwvc3Ryb25nPiBpbiA8L3NwYW4+IFBNPHN1Yj4xMDwvc3ViPiBlbWlzc2lvbnMgb2YgYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHRcIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fUE0xMF9DSEFOR0VcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJcdFx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5mKFwiUE0xMF9DSEFOR0VfQ0xBU1NcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHAgY2xhc3M9XFxcInN1bW1hcnlfZW1pc3Npb25zXFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiUEVSQ19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPiBQTTxzdWI+MTA8L3N1Yj4gZW1pc3Npb25zPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0XHQgICAgPHA+PHN0cm9uZz5QTTxzdWI+MTA8L3N1Yj48L3N0cm9uZz4gZW1pc3Npb25zIGZvciB0aGUgbmV3IHNoaXBwaW5nIGxhbmUgYXJlIGFwcHJveGltYXRlbHkgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdFx0XHRcdCAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk5FV19QTTEwXCIsYyxwLDApKSk7Xy5iKFwiIHRvbnM8L3N0cm9uZz4sIFwiKTtpZihfLnMoXy5mKFwicG1FbWlzc2lvbnNJbmNyZWFzZWRcIixjLHAsMSksYyxwLDAsMjYwOSwyNjExLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ1cFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcInBtRW1pc3Npb25zSW5jcmVhc2VkXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG93blwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdFx0ICAgIFx0XCIpO307Xy5iKFwiIGZyb20gdGhlIHByZXZpb3VzIGVtaXNzaW9ucyBvZiA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIk9SSUdfUE0xMFwiLGMscCwwKSkpO18uYihcIiB0b25zPC9zdHJvbmc+LjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0XHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiXHQgICAgXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0ICA8cD48aT5OT1RFOiBUaGVzZSBlc3RpbWF0ZXMgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgY29tcGFyYXRpdmUgcHVycG9zZXMuICBUaGV5IGFyZSBiYXNlZCBvbiBhbiBhdmVyYWdlIG9mIGNvbnRhaW5lciBzaGlwcyB0aGF0IHRyYW5zaXRlZCB0aGUgU2FudGEgQmFyYmFyYSBDaGFubmVsIGluIDIwMTMuICBFc3RpbWF0ZXMgYXNzdW1lIGFuIGF2ZXJhZ2Ugc3BlZWQgb2YgMTYga25vdHMsIGFuZCBhcmUgY29tcGFyZWQgdG8gZXN0aW1hdGVzIGZvciBhIHRyYW5zaXQgdmlhIHRoZSBkZXNpZ25hdGVkIElNTyBzaGlwcGluZyBsYW5lLjwvaT48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJwcm9wb3NhbE92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJhbnlBdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDE4LDQzNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDxoND5BdHRyaWJ1dGVzIGZvciBcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgPHRoPk5hbWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5WYWx1ZTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwyNzgsMzg0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJcdCAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwidmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdCAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBcdDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiZGlzdGFuY2UgcmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Wm9uZSBTaXplczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInpvbmVzXCIsYyxwLDEpLGMscCwwLDUyOCw2ODcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFRoZSBzZWxlY3RlZCBwcm9wb3NhbCBjb250YWlucyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIlNDX0lEXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IHNrZXRjaGVzIHRoYXQgdG90YWwgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJTSVpFX1NRTUlcIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz4gc3F1YXJlIG1pbGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNoaXBwaW5nIExhbmUgTGVuZ3RoczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImxlbmd0aHNcIixjLHAsMSksYyxwLDAsNzkwLDkyOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICBcdDxwIGNsYXNzPVxcXCJsYXJnZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0VGhlIHByb3Bvc2VkIHNoaXBwaW5nIGxhbmUgPHN0cm9uZz4nXCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIic8L3N0cm9uZz4gaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJORVdfTEVOR1RIXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+IG1pbGVzIGxvbmcuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wic2hpcHBpbmdMYW5lUmVwb3J0XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmYoXCJpbnRlcnNlY3RzUmlnXCIsYyxwLDEpLGMscCwwLDE4LDI5NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBvaWxSaWcgd2FybmluZyBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+T2lsIFBsYXRmb3JtIEludGVyc2VjdGlvbjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgWW91ciBwcm9wb3NhbCBvdmVybGFwcyB0aGUgc2FmZXR5IGFyZWEgYXJvdW5kIGFuIG9pbCBwbGF0Zm9ybSFcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGJyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTFmMmI0NTVjOTYwMDNkYzEzMDEzZTg0XFxcIj5zaG93IHBsYXRmb3JtczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpZ2h0aW5ncyBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIiBjb2xsYXBzZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PldoYWxlIFNpZ2h0aW5nczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5OdW1iZXIgb2Ygd2hhbGUgc2lnaHRpbmdzIHdpdGhpbiB0aGlzIGZvb3RwcmludCBjb21wYXJlZCB0byBleGlzdGluZyBzaGlwcGluZyBsYW5lcy4gU2lnaHRpbmdzIGFyZSByZWNvcmRlZCBieSB3aGFsZXdhdGNoaW5nIHZlc3NlbHMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ3aGFsZVNpZ2h0aW5nc1wiLGMscCwxKSxjLHAsMCw2MDEsNzgwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiZGlmZiBcIik7Xy5iKF8udihfLmYoXCJjaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwicGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiY291bnRcXFwiPlwiKTtfLmIoXy52KF8uZihcImNvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPjwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDwvdWw+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBjbGFzcz1cXFwibW9yZVJlc3VsdHNcXFwiIGhyZWY9XFxcIiNcXFwiPm1vcmUgcmVzdWx0czwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjUxZjJiNDU1Yzk2MDAzZGMxMzAxM2U0NVxcXCI+c2hvdyBzaWdodGluZ3MgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJjb3N0cyByZXBvcnRTZWN0aW9uIFwiKTtfLmIoXy52KF8uZihcImxlbmd0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXN0YW5jZSBhbmQgRnVlbCBDb3N0czwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5UaGUgbmV3IHNoaXBwaW5nIGxhbmUgaGFzIGEgbGVuZ3RoIG9mIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibmV3X2xlbmd0aFwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBtaWxlcy48L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNpZ25pZmljYW50RGlzdGFuY2VDaGFuZ2VcIixjLHAsMSksYyxwLDAsMTE4MCwxNTk4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxwIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48c3BhbiBjbGFzcz1cXFwibWVhc3VyZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibGVuZ3RoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj4gZWFjaCB5ZWFyIGZvciBhbGwgdHJhbnNpdHM8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJkaXN0YW5jZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VcIixjLHAsMCkpKTtfLmIoXCI8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIGNoYW5nZSBpbiBsZW5ndGhcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwiZnVlbFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzcGFuIGNsYXNzPVxcXCJtZWFzdXJlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJ0b25zRnVlbENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgaW4gZnVlbCBjb25zdW1wdGlvblwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJjb3N0XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPiRcIik7Xy5iKF8udihfLmYoXCJjb3N0Q2hhbmdlXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBpbiB2b3lhZ2UgY29zdHNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJzaWduaWZpY2FudERpc3RhbmNlQ2hhbmdlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICA8cCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+Tm8gc2lnbmlmaWNhbnQgZGlmZmVyZW5jZSBmcm9tIGV4aXN0aW5nIGNvbmZpZ3VyYXRpb24uPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gaGFiaXRhdCBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2Vuc2l0aXZlIEJsdWUgV2hhbGUgSGFiaXRhdDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHNwYW4gY2xhc3M9XFxcIm1lYXN1cmVcXFwiPlwiKTtfLmIoXy52KF8uZihcImludGVyc2VjdGVkSXNvYmF0aE1cIixjLHAsMCkpKTtfLmIoXCIgc3F1YXJlIG1ldGVycyBvZiBzZW5zaXRpdmUgaGFiaXRhdCBkaXN0dXJiZWQuPC9zcGFuPjxzcGFuIGNsYXNzPVxcXCJjaGFuZ2UgXCIpO18uYihfLnYoXy5mKFwiaXNvYmF0aENoYW5nZUNsYXNzXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJpc29iYXRoUGVyY2VudENoYW5nZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIndoYWxlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gc2lnaHRpbmdzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5CaW9sb2dpY2FsbHkgSW1wb3J0YW50IEFyZWFzIChCSUFzKVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8YSBocmVmPVxcXCIjXFxcIiBzdHlsZT1cXFwiZmxvYXQ6cmlnaHQ7XFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NGRjZDJlZTlkMmQ5YmEwMzJlMzViMDNcXFwiPnNob3cgQklBIGxheWVyczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRvdGFsIG51bWJlciBvZiBzcS4gbWlsZXMgb2YgYXJlYSBpZGVudGlmaWVkIGFzIGJpb2xvZ2ljYWxseSBpbXBvcnRhbnQgZm9yIGZlZWRpbmcgb3IgbWlncmF0aW5nIGZvciBwYXJ0IG9mIHRoZSB5ZWFyIHRoYXQgb3ZlcmxhcCB3aXRoIHRoZSBmb290cHJpbnQgb2YgdGhlIHNrZXRjaGVkIHBsYW4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2Vuc2l0aXZlV2hhbGVzXCIsYyxwLDEpLGMscCwwLDQwNiw5NzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHA+PHN0cm9uZz5JbiBcIik7Xy5iKF8udihfLmYoXCJTQ19OQU1FXCIsYyxwLDApKSk7Xy5iKFwiczo8L3N0cm9uZz48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJCbHVlXFxcIj5CbHVlIHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5CYWxhZW5vcHRlcmEgbXVzY3VsdXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJCTFVFX1NRTVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxsaSBjbGFzcz1cXFwiR3JheVxcXCI+R3JheSB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+RXNjaHJpY2h0aXVzIHJvYnVzdHVzPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImFyZWFcXFwiPjxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiR1JBWV9TUU1cIixjLHAsMCkpKTtfLmIoXCI8L3N0cm9uZz48L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9saT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgPGxpIGNsYXNzPVxcXCJIdW1wYmFja1xcXCI+SHVtcGJhY2sgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPk1lZ2FwdGVyYSBub3ZhZWFuZ2xpYWU8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJIVU1QX1NRTVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPiAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpZ2h0aW5ncyBcIik7Xy5iKF8udihfLmYoXCJsZW5ndGhDaGFuZ2VDbGFzc1wiLGMscCwwKSkpO18uYihcIiBjb2xsYXBzZWRcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNoYW5uZWwgSXNsYW5kcyBOYXR1cmFsaXN0IENvcnAgT2JzZXJ2YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUb3RhbCBudW1iZXIgb2Ygb2JzZXJ2YXRpb25zIHJlY29yZGVkIGluIHRoZSBmb290cHJpbnQgb2YgdGhpcyBza2V0Y2hlZCBwbGFuIGJ5IHRoZSBDaGFubmVsIElzbGFuZHMgTmF0dXJhbGlzdCBDb3JwIHVwb24gd2hhbGUgd2F0Y2hpbmcgdmVzc2Vscy4gIFZpZXcgdGhlIGVmZm9ydCBsYXllciB0byBhc3Nlc3Mgd2hldGhlciB0aGlzIGlzIGFuIGFwcHJvcHJpYXRlIGRhdGEgc2V0IHRvIHVzZSB0byBjb21wYXJlIHBsYW5zIG9mIGludGVyZXN0LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNNYW5hZ2VtZW50QXJlYXNcIixjLHAsMSksYyxwLDAsMTQyNSwxODc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPHA+PHN0cm9uZz5JbiBNYW5hZ2VtZW50IEFyZWFzOjwvc3Ryb25nPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtZ210X2FyZWFfd2hhbGVzXCIsYyxwLDEpLGMscCwwLDE1MjksMTgzOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJjb3VudF90b3RcIixjLHAsMCkpKTtfLmIoXCIgKFwiKTtfLmIoXy52KF8uZihcImNvdW50X3BlcmNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwwLDE3NDUsMTgwOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJuYV9hcmVhXFxcIj5OL0E8c3VwPio8L3N1cD48L3NwYW4+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgXCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1NoaXBwaW5nTGFuZXNcIixjLHAsMSksYyxwLDAsMTkyOCwyNDA1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8cD48c3Ryb25nPkluIFNoaXBwaW5nIExhbmVzOjwvc3Ryb25nPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNoaXBwaW5nX2xhbmVfd2hhbGVzXCIsYyxwLDEpLGMscCwwLDIwMzgsMjM2MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8bGkgY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPlwiKTtfLmIoXy52KF8uZihcInNjaWVudGlmaWNOYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNfbmFcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiY291bnRcIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiY291bnRfdG90XCIsYyxwLDApKSk7Xy5iKFwiIChcIik7Xy5iKF8udihfLmYoXCJjb3VudF9wZXJjXCIsYyxwLDApKSk7Xy5iKFwiJSk8L3NwYW4+XCIpO18uYihcIlxcblwiKTt9O2lmKF8ucyhfLmYoXCJpc19uYVwiLGMscCwxKSxjLHAsMCwyMjY0LDIzMzIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJuYV9hcmVhXFxcIj5OL0E8c3VwPio8L3N1cD48L3NwYW4+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3VsPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc090aGVyV2hhbGVzXCIsYyxwLDEpLGMscCwwLDI0NTAsMjkwNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwPjxzdHJvbmc+SW4gT3RoZXIgU2tldGNoIFR5cGVzOjwvc3Ryb25nPjwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHVsIGNsYXNzPVxcXCJzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJvdGhlcldoYWxlU2lnaHRpbmdzXCIsYyxwLDEpLGMscCwwLDI1NTksMjg2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJjb3VudF90b3RcIixjLHAsMCkpKTtfLmIoXCIgKFwiKTtfLmIoXy52KF8uZihcImNvdW50X3BlcmNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIpO307aWYoXy5zKF8uZihcImlzX25hXCIsYyxwLDEpLGMscCwwLDI3NzUsMjgzOSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJuYV9hcmVhXFxcIj5OL0E8c3VwPio8L3N1cD48L3NwYW4+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgIDwvdWw+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU1NDFhOWFiY2RhYzRjYWEwMjVhM2JhOFxcXCI+c2hvdyBlZmZvcnQgbGF5ZXI8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzTkFzXCIsYyxwLDEpLGMscCwwLDMwNDIsMzMyNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwIHN0eWxlPVxcXCJtYXJnaW4tdG9wOjMwcHg7XFxcIj48c3VwPio8L3N1cD48aT5XaGFsZSBzaWdodGluZyBjb3VudHMgYXJlIG9ubHkgYXBwbGljYWJsZSB3aXRoaW4gdGhlIENoYW5uZWwgSXNsYW5kIE5hdHVyYWxpc3QgQ29ycCBPYnNlcnZhdGlvbiBhcmVhLiBJZiBhdCBsZWFzdCA3NSUgb2YgYSBtYW5hZ2VtZW50IGFyZWEgb3Igc2hpcHBpbmcgbGFuZSBsaWVzIG91dHNpZGUgdGhpcyByZWdpb24sIHRoZSBjb3VudCB2YWx1ZXMgd2lsbCBiZSBtYXJrZWQgYXMgTi9BLjwvaT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInpvbmVPdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5mKFwiYW55QXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCwxOCw0MzcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8aDQ+QXR0cmlidXRlcyBmb3IgXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiA8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgIDx0aD5OYW1lPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8dGg+VmFsdWU8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsMjc4LDM4NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXHQgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcInZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXHQgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXHQ8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcImRpc3RhbmNlIHJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8cCBjbGFzcz1cXFwibGFyZ2VcXFwiPlRoZSBzZWxlY3RlZCBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw1NjAsNTkzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJwcm9wb3NhbCBjb250YWlucyB6b25lcyB0aGF0IGFyZSBcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgem9uZSBpcyBcIik7fTtfLmIoXCIgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJ6b25lc2l6ZVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPiBzcXVhcmUgbWlsZXMuPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ6b25lV2hhbGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiBzaWdodGluZ3NcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkJpb2xvZ2ljYWxseSBJbXBvcnRhbnQgQXJlYXMgKEJJQXMpXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxhIGhyZWY9XFxcIiNcXFwiIHN0eWxlPVxcXCJmbG9hdDpyaWdodDtcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU0ZGNkMmVlOWQyZDliYTAzMmUzNWIwM1xcXCI+c2hvdyBCSUEgbGF5ZXJzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVG90YWwgbnVtYmVyIG9mIHNxLiBtaWxlcyBvZiBhcmVhIGlkZW50aWZpZWQgYXMgYmlvbG9naWNhbGx5IGltcG9ydGFudCBmb3IgZmVlZGluZyBvciBtaWdyYXRpbmcgZm9yIHBhcnQgb2YgdGhlIHllYXIgdGhhdCBvdmVybGFwIHdpdGggdGhlIGZvb3RwcmludCBvZiB0aGUgc2tldGNoZWQgcGxhbi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzZW5zaXRpdmVXaGFsZXNcIixjLHAsMSksYyxwLDAsNDA2LDE2MTEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPHA+PHN0cm9uZz5JbiBcIik7Xy5iKF8udihfLmYoXCJTQ19OQU1FXCIsYyxwLDApKSk7Xy5iKFwiczo8L3N0cm9uZz48L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwhLS1cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkJsdWVcXFwiPkJsdWUgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPkJhbGFlbm9wdGVyYSBtdXNjdWx1czwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJCTFVFX1NRTVwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJCTFVFX1RPVFwiLGMscCwwKSkpO18uYihcIiBzcS4gbWkuIDxzdHJvbmc+KFwiKTtfLmIoXy52KF8uZihcIkJMVUVfUEVSQ1wiLGMscCwwKSkpO18uYihcIiUpPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJHcmF5XFxcIj5HcmF5IHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5Fc2NocmljaHRpdXMgcm9idXN0dXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+XCIpO18uYihfLnYoXy5mKFwiR1JBWV9TUU1cIixjLHAsMCkpKTtfLmIoXCIgb2YgXCIpO18uYihfLnYoXy5mKFwiR1JBWV9UT1RcIixjLHAsMCkpKTtfLmIoXCIgc3EuIG1pLiA8c3Ryb25nPihcIik7Xy5iKF8udihfLmYoXCJHUkFZX1BFUkNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICA8bGkgY2xhc3M9XFxcIkh1bXBiYWNrXFxcIj5IdW1wYmFjayB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+TWVnYXB0ZXJhIG5vdmFlYW5nbGlhZTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJIVU1QX1NRTVwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJIVU1QX1RPVFwiLGMscCwwKSkpO18uYihcIiBzcS4gbWkuIDxzdHJvbmc+KFwiKTtfLmIoXy52KF8uZihcIkhVTVBfUEVSQ1wiLGMscCwwKSkpO18uYihcIiUpPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+ICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8bGkgY2xhc3M9XFxcIkJsdWVcXFwiPkJsdWUgd2hhbGVzIDxzcGFuIGNsYXNzPVxcXCJzY2lcXFwiPkJhbGFlbm9wdGVyYSBtdXNjdWx1czwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkJMVUVfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJHcmF5XFxcIj5HcmF5IHdoYWxlcyA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5Fc2NocmljaHRpdXMgcm9idXN0dXM8L3NwYW4+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYXJlYVxcXCI+PHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJHUkFZX1NRTVwiLGMscCwwKSkpO18uYihcIjwvc3Ryb25nPjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICA8bGkgY2xhc3M9XFxcIkh1bXBiYWNrXFxcIj5IdW1wYmFjayB3aGFsZXMgPHNwYW4gY2xhc3M9XFxcInNjaVxcXCI+TWVnYXB0ZXJhIG5vdmFlYW5nbGlhZTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj48c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIkhVTVBfU1FNXCIsYyxwLDApKSk7Xy5iKFwiPC9zdHJvbmc+PC9zcGFuPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvbGk+ICBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+Q2hhbm5lbCBJc2xhbmRzIE5hdHVyYWxpc3QgQ29ycHMgT2JzZXJ2YXRpb25zPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUb3RhbCBudW1iZXIgb2Ygb2JzZXJ2YXRpb25zIHJlY29yZGVkIGluIHRoZSBmb290cHJpbnQgb2YgdGhpcyBza2V0Y2hlZCBwbGFuIGJ5IHRoZSBDaGFubmVsIElzbGFuZHMgTmF0dXJhbGlzdCBDb3JwIHVwb24gd2hhbGUgd2F0Y2hpbmcgdmVzc2Vscy4gIFZpZXcgdGhlIGVmZm9ydCBsYXllciB0byBhc3Nlc3Mgd2V0aGVyIHRoaXMgaXMgYW4gYXBwcm9wcmlhdGUgZGF0YSBzZXQgdG8gdXNlIHRvIGNvbXBhcmUgcGxhbnMgb2YgaW50ZXJlc3QuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dWwgY2xhc3M9XFxcInNpZ2h0aW5nc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIndoYWxlU2lnaHRpbmdzXCIsYyxwLDEpLGMscCwwLDIwNTQsMjIyOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGxpIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIiA8c3BhbiBjbGFzcz1cXFwic2NpXFxcIj5cIik7Xy5iKF8udihfLmYoXCJzY2llbnRpZmljTmFtZVwiLGMscCwwKSkpO18uYihcIjwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJhcmVhXFxcIj5cIik7Xy5iKF8udihfLmYoXCJjb3VudFwiLGMscCwwKSkpO18uYihcIiBvZiBcIik7Xy5iKF8udihfLmYoXCJjb3VudF90b3RcIixjLHAsMCkpKTtfLmIoXCIgKFwiKTtfLmIoXy52KF8uZihcImNvdW50X3BlcmNcIixjLHAsMCkpKTtfLmIoXCIlKTwvc3Bhbj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2xpPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICA8L3VsPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgY2xhc3M9XFxcIm1vcmVSZXN1bHRzXFxcIiBocmVmPVxcXCIjXFxcIj5tb3JlIHJlc3VsdHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiBzdHlsZT1cXFwiZmxvYXQ6cmlnaHQ7XFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1NTQxYTlhYmNkYWM0Y2FhMDI1YTNiYThcXFwiPnNob3cgZWZmb3J0IGxheWVyPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59Il19
