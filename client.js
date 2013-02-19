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

  Client.setTabs = function setTabs(user, device, data, cb) {
    // Temporarily, tabs needs to be a string.
    var tabs = { tabs: JSON.stringify(data) };

    var url = "/tabs/" + user + "/" + device;

    var req = new XMLHttpRequest();

    req.onreadystatechange=function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          cb(null);
        } else {
          cb(req.status);
        }
      }
    };

    req.open("PUT", url , true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(tabs));
  };

  Client.getDevices = function getDevices(user, cb) {
    var url = "/tabs/" + user;

    var req = new XMLHttpRequest();

    req.onreadystatechange=function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          cb(null, req.response);
        } else {
          cb(req.status);
        }
      }
    };

    req.open("GET", url , true);
    req.responseType = "json";
    req.send();
  };

  Client.getTabs = function getTabs(user, device, cb) {
    var url = "/tabs/" + user + "/" + device;

    var req = new XMLHttpRequest();

    req.onreadystatechange=function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          var res = JSON.parse(req.response.tabs);
          cb(null, res);
        } else {
          cb(req.status);
        }
      }
    };

    req.open("GET", url , true);
    req.responseType = "json";
    req.send();
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
