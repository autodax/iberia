#!/usr/bin/env node
// Iberia home relay: the same relay as relay/ (Cloudflare), but running on your own computer.
// Needs only Node.js 18 or newer. No packages to install.
//   node relay.js            (listens on port 8787, or set PORT=1234)
// To let friends reach it over the internet, run a tunnel next to it. See start-home-relay.command.
//
// Protocol (identical to the Cloudflare relay):
//  guest -> relay: any text, forwarded to the host as {g:<guest id>, d:<text>}
//  host  -> relay: {g, d} is forwarded to that guest as plain text, {t:'kick', g} disconnects a guest
//  relay -> host:  {t:'open', g} when a guest joins, {t:'close', g} when one leaves
//  "ping" is answered with "pong". If the host leaves, every guest in the room is disconnected.
// The relay never looks inside game messages and stores nothing.

const http = require('http');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8787;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_PAYLOAD = 1 << 20;
const CODE = /^[A-Z0-9]{4,8}$/;
const rooms = new Map(); // code -> {host, guests: Map(id -> socket)}

/* ---------- a small WebSocket implementation (RFC 6455: text, ping, close) ---------- */
function frame(opcode, payload) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const n = body.length;
  let head;
  if (n < 126) head = Buffer.from([0x80 | opcode, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, body]);
}

function upgrade(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return null; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const ws = { alive: true, onmessage: null, onclose: null };
  let buf = Buffer.alloc(0), partial = [], closedSent = false;
  ws.send = s => { if (ws.alive) { try { socket.write(frame(0x1, s)); } catch (e) {} } };
  ws.close = (code, reason) => {
    if (!ws.alive) return;
    if (!closedSent) {
      closedSent = true;
      const r = Buffer.from(reason || '');
      const p = Buffer.alloc(2 + r.length); p.writeUInt16BE(code || 1000, 0); r.copy(p, 2);
      try { socket.write(frame(0x8, p)); } catch (e) {}
    }
    setTimeout(() => socket.destroy(), 200);
  };
  const finish = () => { if (ws.alive) { ws.alive = false; if (ws.onclose) ws.onclose(); } };
  socket.on('close', finish);
  socket.on('error', () => { socket.destroy(); finish(); });
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = !!(buf[0] & 0x80), op = buf[0] & 0x0f, masked = !!(buf[1] & 0x80);
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > MAX_PAYLOAD || !masked) { ws.close(1009, 'bad frame'); socket.destroy(); return; }
      if (buf.length < off + 4 + len) return;
      const mask = buf.subarray(off, off + 4);
      const data = Buffer.from(buf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      buf = buf.subarray(off + 4 + len);
      if (op === 0x8) { ws.close(1000, ''); finish(); return; }
      if (op === 0x9) { try { socket.write(frame(0xA, data)); } catch (e) {} continue; }
      if (op === 0xA) continue;
      if (op === 0x1 || op === 0x0) {
        partial.push(data);
        if (fin) { const text = Buffer.concat(partial).toString('utf8'); partial = []; if (ws.onmessage) ws.onmessage(text); }
      }
    }
  });
  return ws;
}

/* ---------- rooms ---------- */
function refuse(ws, code) { ws.send(JSON.stringify({ t: 'error', code })); ws.close(1008, code); }

function onConnect(ws, code, role) {
  ws.onmessage = text => { if (text === 'ping') ws.send('pong'); };
  let room = rooms.get(code);
  if (role === 'host') {
    if (room && room.host) return refuse(ws, 'taken');
    room = { host: ws, guests: new Map() };
    rooms.set(code, room);
    ws.send(JSON.stringify({ t: 'ready' }));
    ws.onmessage = text => {
      if (text === 'ping') return ws.send('pong');
      let m; try { m = JSON.parse(text); } catch (e) { return; }
      if (!m || typeof m.g !== 'string') return;
      const g = room.guests.get(m.g);
      if (!g) return;
      if (m.t === 'kick') g.close(1000, 'kicked');
      else if (typeof m.d === 'string') g.send(m.d);
    };
    ws.onclose = () => {
      for (const g of room.guests.values()) g.close(1012, 'host left');
      if (rooms.get(code) === room) rooms.delete(code);
    };
  } else if (role === 'guest') {
    if (!room || !room.host) return refuse(ws, 'notfound');
    const gid = crypto.randomBytes(4).toString('hex');
    room.guests.set(gid, ws);
    ws.send(JSON.stringify({ t: 'ready' }));
    room.host.send(JSON.stringify({ t: 'open', g: gid }));
    ws.onmessage = text => {
      if (text === 'ping') return ws.send('pong');
      if (room.host) room.host.send(JSON.stringify({ g: gid, d: text }));
    };
    ws.onclose = () => {
      room.guests.delete(gid);
      if (room.host) room.host.send(JSON.stringify({ t: 'close', g: gid }));
    };
  } else refuse(ws, 'badrole');
}

/* ---------- server ---------- */
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('Iberia relay OK');
});
server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, 'http://x');
  const m = /^\/room\/([A-Za-z0-9]+)$/.exec(url.pathname);
  const code = m && m[1].toUpperCase();
  if (!code || !CODE.test(code)) { socket.write('HTTP/1.1 400 Bad Request\r\n\r\n'); socket.destroy(); return; }
  const ws = upgrade(req, socket);
  if (ws) onConnect(ws, code, url.searchParams.get('role'));
});
server.listen(PORT, () => console.log('Iberia home relay listening on port ' + PORT + '. Rooms are held in memory; stop with Ctrl+C.'));
