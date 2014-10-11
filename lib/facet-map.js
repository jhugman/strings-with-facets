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
        } else {
          crawlObject(prefix + key + '.', suffix, value, ret, config);
        }
      } else {
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
  this._chooser = createChooser(options, config);
  this._map = collapseObjectKeys(initial, config);
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

});

module.exports = {
  Map: Map,
  collapse: collapseObjectKeys
};