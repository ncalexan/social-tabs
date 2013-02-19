(function () {

  var Client = {};

  // global on the server, window in the browser
  var root, previous_Client;

  root = this;
  if (root != null) {
    previous_Client = root.Client;
  }

  Client.noConflict = function () {
    root.Client = previous_Client;
    return Client;
  };

  // Not exported.
  function _getJSON(url, cb) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          cb(null, req.response);
        } else {
          cb(req.status);
        }
      }
    };

    req.open("GET", url, true);
    req.responseType = "json";
    req.send();
  }

  // Not exported.
  function _putJSON(url, data, cb) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function onreadystatechange() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          cb(null);
        } else {
          cb(req.status);
        }
      }
    };

    req.open("PUT", url, true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(data));
  };

  Client.init = function init(options) {
    // Use the injected AJAX functions if available, otherwise use our
    // default XHR functions.
    options = options || {};
    this.getJSON = options.getJSON || _getJSON;
    this.putJSON = options.putJSON || _putJSON;
  };

  Client.setTabs = function setTabs(user, device, data, cb) {
    // Temporarily, tabs needs to be a string.
    var tabs = { tabs: JSON.stringify(data) };

    var url = "/tabs/" + user + "/" + device;

    this.putJSON(url, tabs, cb);
  };

  Client.getDevices = function getDevices(user, cb) {
    var url = "/tabs/" + user;

    this.getJSON(url, cb);
  };

  Client.getTabs = function getTabs(user, device, cb) {
    var url = "/tabs/" + user + "/" + device;

    this.getJSON(url, function _cb(err, response) {
      if (err) {
        cb(err);
        return;
      }

      // Temporarily, tabs returns a string.
      try {
        var res = JSON.parse(response.tabs);
        cb(err, res);
      } catch (e) {
        cb(e);
      }
    });
  };

  // AMD / RequireJS
  if (typeof define !== 'undefined' && define.amd) {
    define([], function () {
      return Client;
    });
  }
  // Node.js
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Client;
  }
  // included directly via <script> tag
  else {
    root.Client = Client;
  }

}());
