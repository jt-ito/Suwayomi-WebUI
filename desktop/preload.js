/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Electron main/preload run as CommonJS outside the WebUI build, where require and console are the norm
/* oxlint-disable */
const { contextBridge, ipcRenderer } = require('electron');

// The WebUI feature-detects this object: when it exists, "open in WebView" opens a native browser window instead of the
// streamed, server-side one.
contextBridge.exposeInMainWorld('suwayomiDesktop', {
    openWebView: (options) => ipcRenderer.invoke('suwayomi:open-webview', options),
});
