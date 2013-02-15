/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const LOG_TAG = "social-tabs-addon";
const log = console.log.bind(LOG_TAG);

const _ = require("underscore");

const tabs = require("tabs");

const { Cu } = require("chrome");
let Social = Cu.import("resource:///modules/Social.jsm", {}).Social;

function _dataForTab(tab) {
  return { url: tab.url,
           title: tab.title,
           faviconURL: tab.favicon
         };
}

function _filterTab(tab) {
  return false;
  // return (tab.url == "about:blank" || tab.url == "about:newtab");
}

function _broadcastTabEvent(socialProvider, type, tab) {
  if (!socialProvider) {
    log("null social provider port; not broadcasting");
    return;
  }

  let port = socialProvider.getWorkerPort();
  if (!port) {
    log("Couldn't get social provider port; not broadcasting");
    return;
  }

  if (_filterTab(tab))
    return;

  // Fine-grained.
  port.postMessage({ topic: "tab." + type,
                     data: _dataForTab(tab) });

  // Coarse-grained.
  let allTabs = [];
  for each (var atab in tabs) {
      allTabs.push(_dataForTab(atab));
  }
  port.postMessage({ topic: "tabs",
                     data: allTabs });
}

function broadcastTabEvent(socialProvider, type, tab) {
  if (!Social.enabled || socialProvider === null) {
    log("Social not enabled or no provider; not broadcasting");
    return;
  }

  _broadcastTabEvent(socialProvider, type, tab);
}

function startBroadcastingTabEventsTo(socialProvider) {
  for each (var event in ["open", "ready", "close"]) {
    tabs.on(event, broadcastTabEvent.bind(undefined, socialProvider, event));
  }
  log("Broadcasting tab events to provider", socialProvider);
}

/**
 * We want "tabs providers" to be able to send events to the add-on
 * and possibly receive responses.  This wires up such query events
 * with responses.
 *
 * @param {SocialProvider} socialProvider to send events to.
 */
function addTabsRequestHandlersTo(socialProvider) {
  let workerAPI = socialProvider.workerAPI;
  if (!workerAPI)
    return;

  workerAPI.handlers['social.tabs.fetchAll'] = function(data) {
    log('social.tabs.fetchAll');
    this._port.postMessage({topic: 'social.tabs.fetchAll-response',
                            data: _.map(tabs, _dataForTab)});
  };
}

function startListeningForTabRequests() {
  let WorkerAPI = Cu.import("resource://gre/modules/WorkerAPI.jsm", {}).WorkerAPI;

  // Monkey patch in our new handlers.
  WorkerAPI.prototype.handlers['social.tabs.request-events'] = function(data) {
    log("social.tabs.request-events", "this =", this, "data =", JSON.stringify(data));

    let deviceInfo = null;
    let enable = !!data;
    if (enable) {
      startBroadcastingTabEventsTo(this._provider);
      addTabsRequestHandlersTo(this._provider);
      deviceInfo = require("./deviceinfo").deviceInfo;
    } else {
      // Nothing for now.
    }

    let port = this._provider.getWorkerPort();
    port.postMessage({topic: 'social.tabs.request-events-response',
                      data: { 'localDeviceInfo': deviceInfo } });
  };
}

startListeningForTabRequests();

log("Add-on started with Social " + Social);
