/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Electron main/preload run as CommonJS outside the WebUI build, where require and console are the norm
/* oxlint-disable */
const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SERVER_URL = 'http://localhost:4567';
const WEBVIEW_PARTITION = 'persist:suwayomi-webview';
const COOKIE_BATCH_SIZE = 400; // the server accepts at most 500 cookies per request
const COOKIE_SYNC_DELAY_MS = 1500;

/** `--server=<url>`, then `SUWAYOMI_URL`, then `server.json` in the user data folder, then the default */
const getServerUrl = () => {
    const arg = process.argv.find((a) => a.startsWith('--server='));
    if (arg) {
        return arg.slice('--server='.length);
    }
    if (process.env.SUWAYOMI_URL) {
        return process.env.SUWAYOMI_URL;
    }
    try {
        const saved = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'server.json'), 'utf8'));
        if (typeof saved.url === 'string') {
            return saved.url;
        }
    } catch {
        // no saved config
    }
    return DEFAULT_SERVER_URL;
};

const isHttpUrl = (value) => {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

const authHeaders = (accessToken) => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

/** The server's user agent: clearance cookies are only valid for the user agent they were issued to. */
const fetchServerUserAgent = async (apiBase, accessToken) => {
    const response = await fetch(`${apiBase}/api/v1/webview/user-agent`, { headers: authHeaders(accessToken) });
    if (!response.ok) {
        throw new Error(`user agent request failed: ${response.status}`);
    }
    return (await response.json()).userAgent;
};

/** Sends every cookie the native browser collected to the server's cookie store (the one extensions use). */
const syncCookies = async (webviewSession, apiBase, accessToken) => {
    const cookies = (await webviewSession.cookies.get({})).map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain ?? '',
        path: cookie.path ?? '/',
        expires: cookie.expirationDate ? Math.round(cookie.expirationDate * 1000) : null,
        secure: !!cookie.secure,
        httpOnly: !!cookie.httpOnly,
    }));

    for (let i = 0; i < cookies.length; i += COOKIE_BATCH_SIZE) {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(`${apiBase}/api/v1/webview/cookies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
            body: JSON.stringify({ cookies: cookies.slice(i, i + COOKIE_BATCH_SIZE) }),
        });
        if (!response.ok) {
            console.error(`cookie sync failed: ${response.status}`);
            return;
        }
    }
};

const openWebView = async (event, { apiBase, url, accessToken }) => {
    if (!isHttpUrl(url) || !isHttpUrl(apiBase)) {
        throw new Error('invalid url');
    }

    const webviewSession = session.fromPartition(WEBVIEW_PARTITION);
    try {
        webviewSession.setUserAgent(await fetchServerUserAgent(apiBase, accessToken));
    } catch (e) {
        console.error('could not adopt the server user agent, challenges may not carry over:', e.message);
    }

    const win = new BrowserWindow({
        width: 1100,
        height: 800,
        parent: BrowserWindow.fromWebContents(event.sender) ?? undefined,
        autoHideMenuBar: true,
        backgroundColor: '#000000',
        webPreferences: { session: webviewSession, contextIsolation: true, sandbox: true },
    });

    // challenges and logins finish somewhere in the middle of browsing: sync shortly after the page settles, and once
    // more when the window closes
    let syncTimer;
    const scheduleSync = () => {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(
            () => syncCookies(webviewSession, apiBase, accessToken).catch(console.error),
            COOKIE_SYNC_DELAY_MS,
        );
    };
    win.webContents.on('did-finish-load', scheduleSync);
    win.webContents.on('did-navigate-in-page', scheduleSync);
    win.on('close', () => {
        clearTimeout(syncTimer);
        syncCookies(webviewSession, apiBase, accessToken).catch(console.error);
    });

    // links that want a new window stay in this one
    win.webContents.setWindowOpenHandler(({ url: target }) => {
        if (isHttpUrl(target)) {
            win.loadURL(target);
        }
        return { action: 'deny' };
    });

    await win.loadURL(url);
    return { ok: true };
};

const createMainWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 860,
        backgroundColor: '#000000',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
    });

    // anything that is not the Suwayomi server opens in the normal browser
    const serverOrigin = new URL(getServerUrl()).origin;
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isHttpUrl(url) && new URL(url).origin !== serverOrigin) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    win.loadURL(getServerUrl());
};

app.whenReady().then(() => {
    ipcMain.handle('suwayomi:open-webview', openWebView);
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
