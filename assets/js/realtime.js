/**
 * Simple WebSocket JSON room client
 * For support: help@rskworld.in • +91 9330539277
 */

export class RealtimeClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.room = null;
        this.handlers = new Map();
    }

    on(type, cb) { this.handlers.set(type, cb); }

    _emit(type, data) { this.handlers.get(type)?.(data); }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.ws.addEventListener('open', () => { this._emit('open'); resolve(); });
                this.ws.addEventListener('message', (ev) => this._onMessage(ev));
                this.ws.addEventListener('close', () => this._emit('close'));
                this.ws.addEventListener('error', (e) => this._emit('error', e));
            } catch (e) { reject(e); }
        });
    }

    _send(obj) {
        if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj));
    }

    _onMessage(ev) {
        try {
            const msg = JSON.parse(ev.data);
            this._emit('message', msg);
            if (msg.type) this._emit(msg.type, msg);
        } catch {}
    }

    create(room) {
        this.room = room;
        this._send({ action: 'create', room });
    }

    join(room) {
        this.room = room;
        this._send({ action: 'join', room });
    }

    leave() {
        if (!this.room) return;
        this._send({ action: 'leave', room: this.room });
        this.room = null;
    }

    sendMove(from, to, fen) {
        if (!this.room) return;
        this._send({ action: 'move', room: this.room, from, to, fen });
    }

    sendChat(text) {
        if (!this.room) return;
        this._send({ action: 'chat', room: this.room, text });
    }

    sendState(fen) {
        if (!this.room) return;
        this._send({ action: 'state', room: this.room, fen });
    }
}


