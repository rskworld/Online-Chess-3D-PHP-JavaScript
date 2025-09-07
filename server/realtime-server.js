// Simple WebSocket room server
// Run: npm i ws && node server/realtime-server.js

const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });
// roomId -> { clients:Set<ws>, fen:string|null, players:{ w:ws|null, b:ws|null } }
const rooms = new Map();

function roomState(roomId) {
    if (!rooms.has(roomId)) rooms.set(roomId, { clients: new Set(), fen: null, players: { w: null, b: null } });
    return rooms.get(roomId);
}

function broadcast(roomId, data, except) {
    const room = roomState(roomId);
    for (const client of room.clients) {
        if (client !== except && client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    }
}

wss.on('connection', (ws) => {
    ws.roomId = null;
    ws.on('message', (buf) => {
        let msg = null;
        try { msg = JSON.parse(buf.toString()); } catch { return; }
        const { action, room, from, to, fen, text } = msg || {};
        if (action === 'create') {
            const r = roomState(room);
            r.clients.add(ws);
            ws.roomId = room;
            // assign side
            if (!r.players.w) {
                r.players.w = ws; ws.send(JSON.stringify({ type: 'assign', side: 'w' }));
            } else if (!r.players.b) {
                r.players.b = ws; ws.send(JSON.stringify({ type: 'assign', side: 'b' }));
            } else {
                ws.send(JSON.stringify({ type: 'assign', side: 's' }));
            }
            if (r.fen) ws.send(JSON.stringify({ type: 'state', fen: r.fen }));
        } else if (action === 'join') {
            const r = roomState(room);
            r.clients.add(ws);
            ws.roomId = room;
            if (!r.players.w) {
                r.players.w = ws; ws.send(JSON.stringify({ type: 'assign', side: 'w' }));
            } else if (!r.players.b) {
                r.players.b = ws; ws.send(JSON.stringify({ type: 'assign', side: 'b' }));
            } else {
                ws.send(JSON.stringify({ type: 'assign', side: 's' }));
            }
            if (r.fen) ws.send(JSON.stringify({ type: 'state', fen: r.fen }));
        } else if (action === 'leave') {
            const r = roomState(ws.roomId);
            r.clients.delete(ws);
            if (r.players.w === ws) r.players.w = null;
            if (r.players.b === ws) r.players.b = null;
            ws.roomId = null;
        } else if (action === 'move' && ws.roomId) {
            const r = roomState(ws.roomId);
            if (typeof fen === 'string') r.fen = fen;
            broadcast(ws.roomId, { type: 'move', from, to, fen }, ws);
        } else if (action === 'state' && ws.roomId) {
            const r = roomState(ws.roomId);
            if (typeof fen === 'string') r.fen = fen;
            broadcast(ws.roomId, { type: 'state', fen }, ws);
        } else if (action === 'chat' && ws.roomId) {
            broadcast(ws.roomId, { type: 'chat', text }, ws);
        }
    });
    ws.on('close', () => {
        const r = rooms.get(ws.roomId);
        if (r) {
            r.clients.delete(ws);
            if (r.players?.w === ws) r.players.w = null;
            if (r.players?.b === ws) r.players.b = null;
        }
    });
});

console.log('Realtime server on ws://localhost:8080');


