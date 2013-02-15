
function onLoad() {
  var worker = navigator.mozSocial.getWorker();
  $("body").css("background-color", worker? "green": "red")
  $("#domain").text(location.host);
  var data = document.cookie.split("=",2)[1];
  userIsConnected(JSON.parse(data));
}

// a fake login function that sets a cookie.  Our worker is polling for
// cookie changes and will update the user-profile based on this.
function signin() {
  var end = location.href.indexOf("sidebar.htm");
  var baselocation = location.href.substr(0, end);
  var userdata = {
    portrait: baselocation + "/user.png",
    userName: "matey",
    dispayName: "Bucko Matey",
    profileURL: baselocation + "/user.html"
  };
  document.cookie="userdata="+JSON.stringify(userdata);
}

function signout() {
  // send an empty user object to signal a signout to firefox.  our worker
  // is polling for cookies and will do the real work.
  document.cookie="userdata=";
}

// open a flyout panel using a data url.  This is a good way to avoid network
// traffic if the amount of data can be minimized.
function openDataPanel(event) {
  // currently cant do this
  var url = "data:text/html,%3Chtml%3E%3Cbody%3E%3Cp%3EInline%20data%3C%2Fp%3E%3C%2Fbody%3E%3C%2Fhtml%3E";
  navigator.mozSocial.openPanel(url, event.clientY, function(win) {
	dump("window is opened "+win+"\n");
  });
}

function userIsConnected(userdata)
{
  $("#userid").text(userdata.userName);
  $("#usericon").attr("src", userdata.portrait);
  $("#useridbox").show();
  $("#usericonbox").show();
  $("#signin").hide();
  $("#content").show();
}

function userIsDisconnected()
{
  $("#signin").show();
  $("#content").hide();
  $("#userid").text("");
  $("#usericon").attr("src", "");
  $("#useridbox").hide();
  $("#usericonbox").hide();
}

var messageHandlers = {
  "worker.connected": function(data) {
    // our port has connected with the worker, do some initialization
    // worker.connected is our own custom message
    var worker = navigator.mozSocial.getWorker();
    worker.port.postMessage({topic: "broadcast.listen", data: true});

    worker.port.postMessage({topic: "worker.tabs.request-events", data: true});
  },
  "social.user-profile": function(data) {
    if (data.userName)
      userIsConnected(data);
    else
      userIsDisconnected();
  },
  'social.user-recommend': function(data) {
    $("#shared").text(data.url);
  },
  'social.user-unrecommend': function(data) {
    $("#shared").text("");
  }
};

navigator.mozSocial.getWorker().port.onmessage = function onmessage(e) {
  dump("SIDEBAR Got message: " + e.data.topic + " " + e.data.data +"\n");
  var topic = e.data.topic;
  var data = e.data.data;

  if (messageHandlers[topic]) {
    messageHandlers[topic](data);
    dump("SIDEBAR Handled message: " + topic + "\n");
    return;
  }

  if (topic && topic == "social.port-closing") {
    dump("SIDEBAR port has closed\n");
    return;
  }

  dump("SIDEBAR Unhandled message: " + e.data.topic + " " + e.data.data +"\n");
};

// here we ask the worker to reload itself.  The worker will send a reload
// message to the Firefox api.
function workerReload() {
  var worker = navigator.mozSocial.getWorker();
  worker.port.postMessage({topic: "worker.reload", data: true});
}

// we open a flyout panel which appears to one side of our sidebar.  The offset
// allows us to line up the panel with our content.  We also get a reference
// to the window in our callback.
var panelWin;
function openPanel(button) {
  var div = document.getElementById("hovertest");
  var baseOffset = button.offsetTop - div.scrollTop + (button.clientHeight/2);
  navigator.mozSocial.openPanel("./flyout.html#"+button.value, baseOffset, function(win) {
    dump("window is opened "+win+"\n");
    panelWin = win;
  });
}
function closePanel() {
  if (panelWin) {
    panelWin.close();
    panelWin = undefined;
  }
}

// we open a chat panel, receiving a reference to the chat window in our
// callback
var chatWin;
function openChat(event) {
  navigator.mozSocial.openChatWindow("./chatWindow.html?id="+(chatters++), function(win) {
	dump("chat window is opened "+win+"\n");
    chatWin = win;
  });
}

// just some test debug output for some events
window.addEventListener("scroll", function(e) {
  dump("scrolling sidebar...\n");
}, false);
window.addEventListener("socialFrameShow", function(e) {
  dump("status window has been shown, visibility is "+document.visibilityState+" or "+navigator.mozSocial.isVisible+"\n");
}, false);
window.addEventListener("socialFrameHide", function(e) {
  dump("status window has been hidden, visibility is "+document.visibilityState+" or "+navigator.mozSocial.isVisible+"\n");
}, false);

// this notify function is used for manual testing.  We tell the worker to
// call an api for us so we can:
// 1. make the worker request a chat window is opened
// 2. make the worker send a notification
var chatters = 0;
function notify(type) {
  var port = navigator.mozSocial.getWorker().port;
  // XXX shouldn't need a full url here.
  var end = location.href.indexOf("sidebar.htm");
  var baselocation = location.href.substr(0, end);
  switch(type) {
    case "link":
      data = {
        id: "foo",
        type: null,
        icon: baselocation+"/icon.png",
        body: "This is a cool link",
        action: "link",
        actionArgs: {
          toURL: baselocation
        }
      };
      port.postMessage({topic:"social.notification-create", data: data});
      break;
    case "chat-request":
      port.postMessage({topic:"social.request-chat", data: baselocation+"/chatWindow.html?id="+(chatters++)});
      break;
  }
};

var localDeviceInfo = null; // { profileID: 'localhost' };

function renderDevice(deviceName, online, tabs) {
  dump("device " + deviceName + " (online: " + online + ")\n");

  var dul = $("#templates>.device-entry").clone();
  dul.find("span.device-name").text(deviceName);

  if (deviceName == localDeviceInfo.profileID)
    dul.addClass("my-device");

  if (online)
    dul.addClass("online");
  else
    dul.addClass("offline");

  var tul = dul.find("ul.device-tabs");
  tabs.forEach(function(tab) {
    dump("tab " + tab.title + "\n");
    var title = tab.title || "(no title)";
    var t = $("#templates>.tab-entry").clone();
    t.find("a").attr("href", tab.url).attr("target", "_blank");
    t.find("a").text(title);
    if (tab.faviconURL)
      t.find("img.tab-favicon").attr("src", tab.faviconURL);
    else
      t.find("img.tab-favicon").remove();
    tul.append(t);
  });

  return dul;
}

function renderTabs(data) {
  var temp = {};
  temp[localDeviceInfo.profileID] = { online: true, tabs: data };
  data = temp;

  var ul = $("div#tabs > ul");
  ul.empty();

  var duls = [];

  var devices = Object.keys(data);
  devices.sort();
  devices.forEach(function(deviceName) {
    // Don't say anything about device's online status for now.
    var online = false; // data[deviceName].online;
    var tabs = data[deviceName].tabs || [];

    var dul = renderDevice(deviceName, online, tabs);
    dump("" + dul);

    ul.append(dul);
  });
};

messageHandlers["tabs"] = renderTabs;

/**
 * Send event to worker requesting it to ask the WorkerAPI for tab
 * events.
 */
function workerTabsRequestEvents() {
  dump("workerTabsRequestEvents");
  var worker = navigator.mozSocial.getWorker();
  worker.port.postMessage({topic: "worker.tabs.request-events", data: true});
}

/**
 * Send event to worker requesting it to ask the WorkerAPI for tab
 * events.
 */
function workerTabsFetchAll() {
  dump("workerTabsFetchAll");
  var worker = navigator.mozSocial.getWorker();
  worker.port.postMessage({topic: "worker.tabs.fetchAll", data: true});
}

messageHandlers["social.tabs.fetchAll-response"] = function(data) {
  dump("social.tabs.fetchAll-response " + JSON.stringify(data));
};

/**
 * Include this machine's name in tabs header.
 */
messageHandlers["social.tabs.request-events-response"] = function(data) {
  dump("social.tabs.request-events-response " + JSON.stringify(data));
  localDeviceInfo = data.localDeviceInfo;
};
