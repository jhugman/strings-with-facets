var _ = require('lodash'),
    makeCache = require('teeny-cache'),
    createChooser = require('./string-chooser');

var collapseObjectKeys = (function () {
  
  function crawlObject (prefix, suffix, object, ret, config) {
    var modifiers = config.modifiers;
    _.each(object, function (i, key) {

      var value = object[key];

      if (_.isObject(value) && !_.isArray(value)) {
        // if (key is one of the config keywords) {
        if (modifiers.indexOf(key) >= 0) {
          crawlObject(prefix, suffix + '.' + key, value, ret, config);
        } else if (key) {
          // key is a user-generated key
          crawlObject(prefix + key + '.', suffix, value, ret, config);
        } else {
          crawlObject(prefix, suffix, value, ret, config);
        }
      } else {
        if (!key) {
          prefix = prefix.substring(0, prefix.length - 1);
        }
        ret[prefix + key + suffix] = value;
      }
    });
    return ret;
  }

  return function collapseObjectKeys (src, config, dest) {
    return crawlObject('', '', src, dest || {}, config);
  };
})();

var Map = function (options, config, initial) {
  var chooser, flatMap;
  if (arguments.length === 2) {
    chooser = options._chooser;
    flatMap = config;
    config = options._config;
  } else {
    chooser = createChooser(options, config);
    flatMap = collapseObjectKeys(initial, config);
  }
  this._chooser = chooser;
  this._config = config;
  this._map = flatMap;
  this._valueCache = makeCache();
  this._initialKeys = _.keys(this._map);
};

_.extend(Map.prototype, {
  get: function (stem) {
    var self = this;
    return self._valueCache(
      stem, 
      function (stem) {
        var key = self._chooser(stem, self._initialKeys);
        return self._map[key];
      }
    );  
  },

  mergeWith: function (that) {
    if (that._map) {
      return new Map(this, _.extend({}, this._map, that._map));
    } else if (_.isObject(that)) {
      return new Map(this, _.extend({}, this._map, collapseObjectKeys(that, this._config)));
    }
    throw new Error('Unsure what to do with merging with ' + that);
  }

});

module.exports = {
  Map: Map,
  collapse: collapseObjectKeys
};