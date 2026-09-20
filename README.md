# Private Radio — Setup & Deploy

A permanent 1-to-1 live audio link. You broadcast (mic + tab audio) from
desktop Chrome/Edge, one specific listener opens a fixed link on their phone
and hears it live over WebRTC. No accounts, no dynamic rooms — just two
fixed URLs.

## What's in here

```
server/           # Signaling server (Node + ws). Only relays handshake
                   # messages — never touches actual audio.
public/broadcast/ # Your control page (desktop)
public/listen/    # Their page (phone, retro styled)
```

## 1. Deploy the signaling server (Railway example)

1. Push this whole folder to a GitHub repo (or just the `server/` folder
   as its own repo — simplest).
2. Go to railway.app → New Project → Deploy from GitHub repo.
3. Set the **root directory** to `server` if you pushed the whole project.
4. Railway auto-detects Node, runs `npm install` then `npm start`.
5. Once deployed, Railway gives you a public URL like
   `your-app-name.up.railway.app`. Your WebSocket URL is that same host
   with `wss://` in front: `wss://your-app-name.up.railway.app`.

(Render.com works the same way — "New Web Service", connect repo, root
dir `server`, build command `npm install`, start command `npm start`.)

## 2. Point both pages at your signaling server

In **both** `public/broadcast/index.html` and `public/listen/index.html`,
find this line:

```js
: 'wss://REPLACE_WITH_YOUR_SIGNALING_SERVER';
```

Replace `REPLACE_WITH_YOUR_SIGNALING_SERVER` with your actual Railway/Render
host, e.g.:

```js
: 'wss://your-app-name.up.railway.app';
```

## 3. Host the two front-end pages

These are plain static HTML files — anything works: GitHub Pages, Netlify,
Vercel, Cloudflare Pages, or even the same Railway/Render service serving
static files. Simplest option: Netlify drag-and-drop.

- Deploy `public/broadcast/` → gives you your permanent broadcast link
  (only you ever open this).
- Deploy `public/listen/` → gives you the permanent link you send to your
  listener.

Because these are static pages with a fixed room name (`"station"` baked
into the server), the URLs never change. Bookmark both.

## 4. Customize the listener page

Open `public/listen/index.html` and edit:

```html
<div id="stationName">RADIO NOWHERE</div>
<div id="subtitle">frequency unknown, signal certain</div>
```

Change the text to whatever you want centered on their screen, then
redeploy that one page.

## 5. Using it

**You (desktop, Chrome or Edge):**
1. Open your broadcast link.
2. Check/uncheck mic and tab-audio as needed.
3. Click **Go Live**. If tab audio is enabled, a picker appears — choose
   the tab playing your music and make sure **"Share tab audio"** is
   checked in that dialog (easy to miss, it's a small checkbox).

**Them (iPhone, Safari):**
1. Open the listen link any time.
2. Tap **"Tap to Join"** once (this is required — iOS blocks audio
   autoplay until a real user tap happens).
3. When you go live, it connects automatically and plays.

They can leave the tab open and it'll just say "Off Air" until you start
broadcasting — no need to re-open the link each time.

## Known limits / things to know

- **Tab/system audio capture only works reliably on desktop Chrome/Edge.**
  This is a browser limitation, not something we can fix in code.
- **STUN only, no TURN yet.** Works fine on most home/mobile networks.
  If the listener is on a network with strict NAT (some corporate wifi,
  some mobile carriers) the connection may fail to establish. If that
  happens repeatedly, the fix is adding a TURN server (e.g. self-hosted
  Coturn, or a paid service) — let me know and we'll add it.
- **One broadcaster, one listener slot at a time** — matches what you
  asked for. If you refresh your broadcast tab, it just takes over the
  broadcaster slot cleanly.
- **Text is static**, edited in code as discussed — no live "now playing"
  updates yet. That's an easy add later (a second small data channel)
  if you ever want it.
