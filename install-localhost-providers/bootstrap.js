/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This bootstrap file uses chrome.manifest to dynamically register
 * chrome/skin/locale URIs, allowing an overlay based addon to easily
 * become restartless.  It is based on work by Dave Townsend at
 * https://github.com/Mossop/WebAppTabs/
 *
 * One limitation is that addons cannot use custom XPCOM interfaces (ie. if you
 * have an IDL file, this wont work). XPCOM registration beyond basic stuff
 * has not been tested.
 */

const Cu = Components.utils;
let Services = Cu.import("resource://gre/modules/Services.jsm").Services;

let origin = "http://localhost:5000";

// bootstrap functions
let manifests = {
  "localhost:5000": {
    "name": "localhost:5000",
    "origin": origin,
    "iconURL": origin + "/icon.png",
    "workerURL": origin + "/worker.js",
    "sidebarURL": origin + "/sidebar.htm",
    "shareURL": origin + "share?url=%{data}"
  },
};

function installProvider(name, manifest) {
  try {
    Services.prefs.setCharPref('social.manifest.'+name, JSON.stringify(manifest));
    let SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;

    // This is going to work for fx20
    SocialService.addProvider(manifest, function(provider) {
      // activate the provider and update the menu
      provider.active = true;
    });

    // Fx21 would do something more simple...
    // SocialService.addBuiltinProvider(manifest.origin);
  } catch(e) {
    Cu.reportError(e);
    Services.prefs.clearUserPref('social.manifest.'+name);
  }
}

function uninstallProvider(name, manifest) {
  try {
    let SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;
    SocialService.removeProvider(manifest.origin, function() {
      Services.prefs.clearUserPref('social.manifest.'+name);
    });
  } catch(e) {
    Cu.reportError(e);
    Services.prefs.clearUserPref('social.manifest.'+name);
  }
}

function install(aParams, aReason) { }

function uninstall(aParams, aReason) { }

function startup(aParams, aReason) {
  // add our example manifests
  for (let key in manifests) {
    Cu.reportError("installing "+key);
    installProvider(key, manifests[key]);
  }

  let window = Services.wm.getMostRecentWindow("navigator:browser");
  window.SocialToolbar.populateProviderMenus();
  // make the provider the current provider, should only be done on
  // install for the user to see the new provider
  //let Social = Cu.import("resource:///modules/Social.jsm", {}).Social;
  //Social.provider = provider;
}

function shutdown(aParams, aReason) {
  // add our example manifests
  for (let key in manifests) {
    Cu.reportError("uninstalling "+key);
    uninstallProvider(key, manifests[key]);
  }
  // all this should only be necessary for fx20
  let window = Services.wm.getMostRecentWindow("navigator:browser");
  window.SocialToolbar.populateProviderMenus();

  let Social = Cu.import("resource:///modules/Social.jsm", {}).Social;
  let SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;
  // force an update
  SocialService.getProviderList(function (providers) {
    if (providers.length)
      Social.provider = providers[0];
  });
}
