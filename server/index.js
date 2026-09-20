// Signaling server for the private radio link.
// Job: relay WebRTC handshake messages (offers/answers/ICE candidates)
// between exactly two roles - "broadcaster" and "listener" - in a fixed room.
// It never touches actual audio. Once the handshake is done, audio flows
// peer-to-peer directly between the two browsers.

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
// Fixed room "id" - since this is a permanent single-station link, we don't
// need dynamic room creation. One station, one broadcaster, one listener slot.
const ROOM = 'station';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('signaling server is running');
});

const wss = new WebSocket.Server({ server });

// roles connected right now: { broadcaster: ws|null, listener: ws|null }
const room = { broadcaster: null, listener: null };

function send(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on('connection', (ws) => {
  let role = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    // First message from a client must declare its role.
    if (msg.type === 'join') {
      role = msg.role === 'broadcaster' ? 'broadcaster' : 'listener';

      // Kick out any stale connection holding this role (e.g. you refreshed the tab)
      if (room[role] && room[role] !== ws) {
        send(room[role], { type: 'replaced' });
        room[role].close();
      }
      room[role] = ws;

      // Tell the broadcaster a listener is here (or vice versa), so whichever
      // side is already connected knows it can start/re-start the handshake.
      const otherRole = role === 'broadcaster' ? 'listener' : 'broadcaster';
      if (room[otherRole]) {
        send(ws, { type: 'peer-online' });
        send(room[otherRole], { type: 'peer-online' });
      } else {
        send(ws, { type: 'peer-offline' });
      }
      return;
    }

    // Relay everything else (offer / answer / ice-candidate) straight to the other role.
    if (!role) return;
    const otherRole = role === 'broadcaster' ? 'listener' : 'broadcaster';
    send(room[otherRole], msg);
  });

  ws.on('close', () => {
    if (role && room[role] === ws) {
      room[role] = null;
      const otherRole = role === 'broadcaster' ? 'listener' : 'broadcaster';
      send(room[otherRole], { type: 'peer-offline' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
