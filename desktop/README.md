# Suwayomi desktop

A small Electron wrapper around the WebUI. Its point is the WebView: instead of a server-side browser that is streamed
as pictures (laggy, grainy), "open in WebView" opens a real browser window in this app, rendered natively.

How it works:

1. The window loads your Suwayomi server (`--server=<url>`, env `SUWAYOMI_URL`, or `server.json` with `{ "url": "..." }`
   in the app's user data folder; default `http://localhost:4567`).
2. The preload script exposes `window.suwayomiDesktop.openWebView(...)`. The WebUI feature-detects it
   (`src/features/webview/components/WebViewModal.tsx`) and falls back to the streamed WebView in a normal browser.
3. The native window presents the **server's user agent** (`GET /api/v1/webview/user-agent`), because clearance cookies
   (e.g. Cloudflare's `cf_clearance`) only work for the user agent they were issued to.
4. The cookies it collects are sent to the server (`POST /api/v1/webview/cookies`) shortly after each page settles and when
   the window closes, so extensions can use them.

Limits: clearance cookies are usually tied to your IP address, so this works when this computer and the server share an
IP (e.g. both at home). The server's user agent string is an older Chrome version than the bundled Chromium; the extra
client hints it sends can still make strict sites suspicious.

```bash
cd desktop
npm install
npm start -- --server=http://localhost:4567
```
