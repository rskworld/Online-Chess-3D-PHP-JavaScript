/** File-based polling realtime client (PHP backend). */

export class FileRealtime {
    constructor(baseUrl) {
        this.baseUrl = baseUrl; // e.g., './api/room.php'
        this.room = null;
        this.clientId = Math.random().toString(36).slice(2,10);
        this.rev = 0;
        this.handlers = new Map();
        this.pollHandle = null;
        this.lastHistoryLen = 0;
        this.lastChatLen = 0;
        this.lastGiftsLen = 0;
    }

    on(type, cb) { this.handlers.set(type, cb); }
    _emit(type, data) { this.handlers.get(type)?.(data); }

    async _call(params) {
        const body = new URLSearchParams(params);
        const res = await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        return await res.json();
    }

    async create(room) {
        this.room = room;
        const res = await this._call({ action: 'create', room, clientId: this.clientId });
        if (res.exists) {
            // If room already exists, behave like join to get correct side assignment
            return await this.join(room);
        }
        if (res.ok) this._emit('assign', { side: res.side || 'w' });
        this.rev = res.rev || 0;
        this.lastHistoryLen = (res.history && res.history.length) ? res.history.length : 0;
        this.lastChatLen = (res.chat && res.chat.length) ? res.chat.length : 0;
        this.lastGiftsLen = (res.gifts && res.gifts.length) ? res.gifts.length : 0;
        // expose initial players/names if provided
        if (res.players) this._emit('players', { players: res.players });
        if (res.names) this._emit('names', { names: res.names });
        this.startPolling();
    }

    async join(room) {
        this.room = room;
        const res = await this._call({ action: 'join', room, clientId: this.clientId });
        if (res.ok) this._emit('assign', { side: res.side || 's' });
        if (res.fen) this._emit('state', { fen: res.fen });
        this.rev = res.rev || 0;
        this.lastHistoryLen = (res.history && res.history.length) ? res.history.length : 0;
        this.lastChatLen = (res.chat && res.chat.length) ? res.chat.length : 0;
        this.lastGiftsLen = (res.gifts && res.gifts.length) ? res.gifts.length : 0;
        // expose initial players/names if provided
        if (res.players) this._emit('players', { players: res.players });
        if (res.names) this._emit('names', { names: res.names });
        this.startPolling();
    }

    async leave() {
        if (!this.room) return;
        // try beacon for reliability on tab close
        try {
            const data = new URLSearchParams({ action: 'leave', room: this.room, clientId: this.clientId });
            navigator.sendBeacon?.(this.baseUrl, data);
        } catch {}
        await this._call({ action: 'leave', room: this.room, clientId: this.clientId });
        this.room = null;
        this.stopPolling();
        this.lastHistoryLen = 0;
        this.lastChatLen = 0;
        this.lastGiftsLen = 0;
    }

    leaveSync() {
        if (!this.room) return;
        try {
            const data = new URLSearchParams({ action: 'leave', room: this.room, clientId: this.clientId });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(this.baseUrl, data);
            } else {
                fetch(this.baseUrl, { method: 'POST', body: data, keepalive: true });
            }
        } catch {}
    }

    async sendMove(from, to, fen) {
        if (!this.room) return;
        const res = await this._call({ action: 'move', room: this.room, clientId: this.clientId, from, to, fen });
        if (res.ok && res.rev) this.rev = res.rev;
    }

    async sendChat(text) {
        if (!this.room) return;
        const res = await this._call({ action: 'chat', room: this.room, clientId: this.clientId, text });
        if (res.ok && res.rev) this.rev = res.rev;
    }

    async setName(name) {
        if (!this.room) return;
        const res = await this._call({ action: 'name', room: this.room, clientId: this.clientId, name });
        if (res.ok && res.rev) this.rev = res.rev;
    }

    async sendGift(gift) {
        if (!this.room) return;
        const res = await this._call({ action: 'gift', room: this.room, clientId: this.clientId, gift });
        if (res.ok && res.rev) this.rev = res.rev;
    }

    startPolling() {
        this.stopPolling();
        this.pollHandle = setInterval(() => this.pollOnce().catch(() => {}), 1000);
    }

    stopPolling() {
        if (this.pollHandle) clearInterval(this.pollHandle);
        this.pollHandle = null;
    }

    async pollOnce() {
        if (!this.room) return;
        const res = await this._call({ action: 'state', room: this.room, since: String(this.rev) });
        if (!res.ok) return;
        if (res.noop) return;
        this.rev = res.rev || this.rev;
        // emit only new moves
        if (Array.isArray(res.history) && res.history.length > this.lastHistoryLen) {
            for (let i = this.lastHistoryLen; i < res.history.length; i++) {
                const h = res.history[i];
                if (h && h.by !== this.clientId) {
                    this._emit('move', { from: h.from, to: h.to, fen: res.fen });
                }
            }
            this.lastHistoryLen = res.history.length;
        }
        // emit only new chat messages
        if (Array.isArray(res.chat) && res.chat.length > this.lastChatLen) {
            for (let i = this.lastChatLen; i < res.chat.length; i++) {
                const c = res.chat[i];
                if (c && c.by !== this.clientId) this._emit('chat', { text: c.text });
            }
            this.lastChatLen = res.chat.length;
        }
        // emit only new gifts
        if (Array.isArray(res.gifts) && res.gifts.length > this.lastGiftsLen) {
            for (let i = this.lastGiftsLen; i < res.gifts.length; i++) {
                const g = res.gifts[i];
                if (g && g.by !== this.clientId) this._emit('gift', { gift: g.gift });
            }
            this.lastGiftsLen = res.gifts.length;
        }
        if (res.names) {
            this._emit('names', { names: res.names });
        }
        if (res.players) {
            this._emit('players', { players: res.players });
        }
        if (res.offer) {
            this._emit('offer', res.offer);
        }
        if (res.result) {
            this._emit('result', res.result);
        }
        if (res.score) {
            this._emit('score', res.score);
        }
    }

    async offer(kind) { return this._call({ action: 'offer', room: this.room, clientId: this.clientId, kind }); }
    async acceptOffer() { return this._call({ action: 'accept_offer', room: this.room, clientId: this.clientId }); }
}


