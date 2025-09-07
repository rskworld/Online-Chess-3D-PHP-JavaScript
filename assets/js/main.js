/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

import { createBoard3D } from './board3d.js';
import { ChessEngine } from './chessEngine.js';
import { findBestMove } from './ai.js';
import { Howl } from 'https://cdn.jsdelivr.net/npm/howler@2.2.4/+esm';
// import { RealtimeClient } from './realtime.js';
import { FileRealtime } from './realtime-file.js';

const SFX = {
    move: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'], volume: 0.4 }),
    capture: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.4 }),
    start: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.4 }),
};

const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const flipBtn = document.getElementById('flipBtn');
const difficultyEl = document.getElementById('difficulty');
const playAsEl = document.getElementById('playAs');
const viewSelect = document.getElementById('viewSelect');
const soundToggle = document.getElementById('soundToggle');
const animToggle = document.getElementById('animToggle');
const exportBtn = document.getElementById('exportBtn');
const resetCameraBtn = document.getElementById('resetCameraBtn');
const themeSelect = document.getElementById('themeSelect');
const volumeEl = document.getElementById('volume');
const coordsToggle = document.getElementById('coordsToggle');
const checkToggle = document.getElementById('checkToggle');
const hintBtn = document.getElementById('hintBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const fsBtn = document.getElementById('fsBtn');
const coordsOverlay = document.getElementById('coords-overlay');
const capturedWhiteEl = document.getElementById('capturedWhite');
const capturedBlackEl = document.getElementById('capturedBlack');
const timerWhiteEl = document.getElementById('timerWhite');
const timerBlackEl = document.getElementById('timerBlack');

const errorOverlay = document.getElementById('error-overlay');
const errorText = document.getElementById('error-text');
const errorClose = document.getElementById('error-close');

let userColor = 'w';
let engine = new ChessEngine();
let board = null;
let selectedSquare = null;
let soundsEnabled = true;
let lastMove = null; // {from,to}
let whiteTime = 5 * 60 * 1000;
let blackTime = 5 * 60 * 1000;
let timerInterval = null;
let lastTick = null;
let rt = null;
let mySide = 'w';
let lastPlayers = null;
let lastNames = null;

function setStatus(text) {
    statusEl.textContent = text;
}

function logMove(move) {
    const li = document.createElement('li');
    li.textContent = `${move.color === 'w' ? movesEl.children.length / 2 + 1 + '.' : ''} ${move.san}`;
    movesEl.appendChild(li);
    movesEl.scrollTop = movesEl.scrollHeight;
}

function refreshBoard() {
    board.updatePosition(engine.getFen());
}

function handleSquareClick(square) {
    const allowedColor = (rt && rt.room) ? mySide : userColor;
    const myTurn = engine.turn() === allowedColor;
    if (!myTurn) return;

    if (selectedSquare) {
        const mv = engine.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (mv) {
            if (soundsEnabled) SFX[mv.captured ? 'capture' : 'move'].play();
            board.animateMove(selectedSquare, square);
            logMove(mv);
            lastMove = { from: selectedSquare, to: square };
            board.setLastMove(selectedSquare, square);
            updateCaptured(mv);
            selectedSquare = null;
            board.clearHighlights();
            updateStatus();
            // broadcast move if in multiplayer
            if (rt && rt.room) {
                rt.sendMove(mv.from, mv.to, engine.getFen());
            } else {
                setTimeout(() => aiTurn(), 150);
            }
        } else {
            selectedSquare = null;
            board.clearHighlights();
        }
    } else {
        const moves = engine.legalMovesFrom(square);
        if (moves && moves.length) {
            selectedSquare = square;
            board.highlightSquares([square, ...moves.map(m => m.to)]);
        }
    }
}

function updateStatus() {
    if (engine.inCheckmate()) {
        setStatus('Checkmate! ' + (engine.turn() === 'w' ? 'Black' : 'White') + ' wins.');
        return;
    }
    if (engine.inStalemate() || engine.inDraw()) {
        setStatus('Draw.');
        return;
    }
    setStatus((engine.turn() === 'w' ? 'White' : 'Black') + ' to move.');
}

async function aiTurn() {
    if (rt && rt.room) return; // no AI in multiplayer
    if (engine.turn() === userColor) return;
    const depth = Number(difficultyEl.value) + 1; // 1..3
    const best = findBestMove(engine, depth);
    if (best) {
        const mv = engine.move({ from: best.from, to: best.to, promotion: 'q' });
        if (mv) {
            if (soundsEnabled) SFX[mv.captured ? 'capture' : 'move'].play();
            board.animateMove(best.from, best.to);
            logMove(mv);
            lastMove = { from: best.from, to: best.to };
            board.setLastMove(best.from, best.to);
            updateCaptured(mv);
            updateStatus();
        }
    }
}

function newGame() {
    engine.reset();
    selectedSquare = null;
    movesEl.innerHTML = '';
    refreshBoard();
    board.clearHighlights();
    if (soundsEnabled) SFX.start.play();
    updateStatus();
    if (!rt || !rt.room) {
        if (userColor === 'b') setTimeout(() => aiTurn(), 300);
    }
    resetTimers();
    startTimer();
}

function init() {
    const container = document.getElementById('board-container');
    try {
        board = createBoard3D(container);
        refreshBoard();
        board.onSquareSelected(handleSquareClick);
        board.setAnimationsEnabled(true);
        updateStatus();
        buildCoords();
        startTimer();
    } catch (e) {
        showError(e);
    }
}

newGameBtn.addEventListener('click', () => newGame());
undoBtn.addEventListener('click', () => {
    const u1 = engine.undo();
    const u2 = engine.undo();
    if (u1) {
        refreshBoard();
        board.clearHighlights();
        if (soundsEnabled) SFX.move.play();
        lastMove = null;
        board.setLastMove(null, null);
        updateStatus();
        movesEl.lastChild && movesEl.removeChild(movesEl.lastChild);
        movesEl.lastChild && movesEl.removeChild(movesEl.lastChild);
    }
});
flipBtn.addEventListener('click', () => {
    const flipped = !board.isFlipped;
    board.setFlipped(flipped);
});
playAsEl.addEventListener('change', () => {
    userColor = playAsEl.value;
    newGame();
});
viewSelect.addEventListener('change', () => {
    board.setView(viewSelect.value);
});
soundToggle.addEventListener('change', () => {
    soundsEnabled = !!soundToggle.checked;
});
animToggle.addEventListener('change', () => {
    board.setAnimationsEnabled(!!animToggle.checked);
});
exportBtn.addEventListener('click', () => {
    const pgn = engine.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
});
resetCameraBtn.addEventListener('click', () => board.resetCamera());
errorClose.addEventListener('click', () => hideError());
themeSelect.addEventListener('change', () => {
    board.applyTheme(themeSelect.value);
});
volumeEl.addEventListener('input', () => {
    const v = Number(volumeEl.value);
    Object.values(SFX).forEach(h => h.volume(v));
});
coordsToggle.addEventListener('change', () => {
    coordsOverlay.dataset.show = coordsToggle.checked ? 'true' : 'false';
});
checkToggle.addEventListener('change', () => {
    updateCheckHighlight();
});
hintBtn.addEventListener('click', () => {
    const best = findBestMove(engine, Number(difficultyEl.value) + 1);
    if (best) {
        board.highlightSquares([best.from, best.to]);
    }
});
saveBtn.addEventListener('click', () => {
    localStorage.setItem('chess_fen', engine.getFen());
});
loadBtn.addEventListener('click', () => {
    const fen = localStorage.getItem('chess_fen');
    if (fen) {
        engine.load(fen);
        refreshBoard();
        board.clearHighlights();
        updateStatus();
    }
});
fsBtn.addEventListener('click', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.();
});

window.addEventListener('DOMContentLoaded', () => init());
window.addEventListener('beforeunload', () => { try { rt?.leaveSync(); } catch {} });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { try { rt?.leaveSync(); } catch {} } });

function showError(err) {
    errorText.textContent = (err && (err.stack || err.message)) || String(err);
    errorOverlay.classList.remove('hidden');
}

function hideError() {
    errorOverlay.classList.add('hidden');
}

// Multiplayer wiring
const apiUrl = './api/room.php';
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const roomIdInput = document.getElementById('roomId');
const mpStatus = document.getElementById('mpStatus');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatLog = document.getElementById('chatLog');
const playerNameInput = document.getElementById('playerName');
const setNameBtn = document.getElementById('setNameBtn');
const whiteNameEl = document.getElementById('whiteName');
const blackNameEl = document.getElementById('blackName');
const giftSelect = document.getElementById('giftSelect');
const giftSendBtn = document.getElementById('giftSendBtn');
const offerDrawBtn = document.getElementById('offerDrawBtn');
const resignBtn = document.getElementById('resignBtn');
const rematchBtn = document.getElementById('rematchBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');

function ensureRealtime() {
    if (rt) return rt;
    rt = new FileRealtime(apiUrl);
    rt.on('assign', (m) => {
        mySide = m.side;
        setMpStatus('You are ' + mySide.toUpperCase());
        userColor = mySide;
        if (playAsEl) { playAsEl.value = mySide; playAsEl.disabled = true; }
        if (board) board.setFlipped(mySide === 'b');
    });
    rt.on('state', (m) => {
        if (m.fen) { engine.load(m.fen); refreshBoard(); updateStatus(); }
        // If we already know players mapping, enforce orientation
        if (lastPlayers && board) {
            const side = (lastPlayers.b === rt.clientId) ? 'b' : 'w';
            mySide = side; userColor = side;
            board.setFlipped(side === 'b');
            if (playAsEl) { playAsEl.value = side; playAsEl.disabled = true; }
        }
    });
    rt.on('move', (m) => handleRtMessage({ type: 'move', ...m }));
    rt.on('chat', (m) => appendChat(m.text, 'remote'));
    rt.on('gift', (m) => showGift(m.gift));
    rt.on('names', (m) => { lastNames = m.names; updateNames(lastNames); });
    rt.on('players', (m) => { lastPlayers = m.players; applySideFromPlayers(); updateNames(lastNames); });
    rt.on('offer', (o) => handleOffer(o));
    rt.on('result', (r) => handleResult(r));
    rt.on('score', (s) => handleScore(s));
    return rt;
}

function setMpStatus(t) { mpStatus.textContent = t; }

function handleRtMessage(msg) {
    if (msg.type === 'state') {
        // future use
    } else if (msg.type === 'move' && msg.fen) {
        // apply move to local engine first for accurate SAN and captures
        const beforeFen = engine.getFen();
        const mv = engine.move({ from: msg.from, to: msg.to, promotion: 'q' });
        if (mv) {
            if (soundsEnabled) SFX[mv.captured ? 'capture' : 'move'].play();
            if (board) board.animateMove(msg.from, msg.to);
            logMove(mv);
            updateCaptured(mv);
            lastMove = { from: msg.from, to: msg.to };
            if (board) board.setLastMove(msg.from, msg.to);
            updateStatus();
        } else {
            // fallback: animate then load full state, and log SAN from previous FEN
            let mvInfo = null;
            try {
                const temp = new ChessEngine(beforeFen);
                mvInfo = temp.move({ from: msg.from, to: msg.to, promotion: 'q' });
            } catch {}
            if (board) board.animateMove(msg.from, msg.to);
            engine.load(msg.fen);
            refreshBoard();
            if (mvInfo) {
                if (soundsEnabled) SFX[mvInfo.captured ? 'capture' : 'move'].play();
                logMove(mvInfo);
                updateCaptured(mvInfo);
            }
            lastMove = { from: msg.from, to: msg.to };
            if (board) board.setLastMove(msg.from, msg.to);
            updateStatus();
        }
    } else if (msg.type === 'chat') {
        appendChat(msg.text, 'remote');
    } else if (msg.type === 'assign') {
        mySide = msg.side || 'w';
    }
}

createRoomBtn.addEventListener('click', async () => {
    ensureRealtime();
    const id = roomIdInput.value || Math.random().toString(36).slice(2, 8);
    roomIdInput.value = id;
    await rt.create(id);
    setMpStatus('Room created: ' + id);
});

joinRoomBtn.addEventListener('click', async () => {
    ensureRealtime();
    const id = roomIdInput.value.trim();
    if (!id) return;
    await rt.join(id);
    setMpStatus('Joined room: ' + id);
});

leaveRoomBtn.addEventListener('click', async () => {
    await rt?.leave();
    setMpStatus('Left room');
    if (playAsEl) playAsEl.disabled = false;
    mySide = 'w';
    userColor = playAsEl ? playAsEl.value : 'w';
});

chatSendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    rt?.sendChat(text);
    appendChat(text, 'me');
    chatInput.value = '';
});

setNameBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) return;
    await rt?.setName(name);
});

giftSendBtn.addEventListener('click', async () => {
    const gift = giftSelect.value;
    await rt?.sendGift(gift);
    showGift(gift);
});

offerDrawBtn.addEventListener('click', async () => { await rt?.offer('draw'); alert('Draw offered'); });
resignBtn.addEventListener('click', async () => { await rt?.offer('resign'); alert('You resigned'); });
rematchBtn.addEventListener('click', async () => { await rt?.offer('rematch'); alert('Rematch offered'); });
copyLinkBtn.addEventListener('click', () => { navigator.clipboard?.writeText(location.href).then(() => alert('Link copied')); });

function appendChat(text, who) {
    const div = document.createElement('div');
    div.textContent = (who === 'me' ? 'You: ' : 'Them: ') + text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function updateNames(names) {
    if (!whiteNameEl || !blackNameEl) return;
    if (lastPlayers && names) {
        const whiteId = lastPlayers.w;
        const blackId = lastPlayers.b;
        whiteNameEl.innerHTML = '♔ ' + (names[whiteId] || 'White');
        blackNameEl.innerHTML = '♚ ' + (names[blackId] || 'Black');
        return;
    }
    // fallback: only my name known
    const me = playerNameInput.value.trim();
    if (mySide === 'w') whiteNameEl.innerHTML = '♔ ' + (me || 'White');
    if (mySide === 'b') blackNameEl.innerHTML = '♚ ' + (me || 'Black');
}

function applySideFromPlayers() {
    if (!lastPlayers) return;
    const side = (lastPlayers.b === rt?.clientId) ? 'b' : 'w';
    if (side !== mySide) {
        mySide = side; userColor = side;
        if (board) board.setFlipped(side === 'b');
        if (playAsEl) { playAsEl.value = side; playAsEl.disabled = true; }
        setMpStatus('You are ' + side.toUpperCase());
    }
}

function showGift(gift) {
    const container = document.getElementById('board-container');
    const span = document.createElement('span');
    span.textContent = gift;
    span.style.position = 'absolute';
    span.style.left = '50%';
    span.style.top = '50%';
    span.style.transform = 'translate(-50%, -50%) scale(0.5)';
    span.style.fontSize = '64px';
    span.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,.6))';
    container.appendChild(span);
    if (window.gsap) {
        const tl = gsap.timeline();
        tl.to(span, { scale: 1.4, duration: 0.25, ease: 'back.out(2)' })
          .to(span, { y: -100, opacity: 0, duration: 0.8, ease: 'power2.in' }, '+=0.6')
          .add(() => span.remove());
    } else {
        setTimeout(() => span.remove(), 1500);
    }
}

function handleOffer(o) {
    if (!o || !o.kind) return;
    if (o.kind === 'draw') {
        if (confirm('Opponent offered a draw. Accept?')) rt?.acceptOffer();
    } else if (o.kind === 'rematch') {
        if (confirm('Opponent offered a rematch. Accept?')) rt?.acceptOffer();
    } else if (o.kind === 'resign') {
        // Opponent resigned; server will set result
        alert('Opponent resigned.');
    }
}

function handleResult(r) {
    if (!r) return;
    alert('Game result: ' + r);
}

function handleScore(s) {
    // Future: render scoreboard
}

function updateCaptured(mv) {
    if (!mv.captured) return;
    const icon = pieceToIcon(mv.captured, mv.color);
    if (mv.color === 'w') {
        capturedWhiteEl.innerHTML += icon;
    } else {
        capturedBlackEl.innerHTML += icon;
    }
}

function pieceToIcon(type, capturerColor) {
    const map = { p:'♙', r:'♖', n:'♘', b:'♗', q:'♕', k:'♔' };
    const mapB = { p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚' };
    return capturerColor === 'w' ? map[type] : mapB[type];
}

function buildCoords() {
    coordsOverlay.innerHTML = '';
    const files = 'abcdefgh'.split('');
    const size = coordsOverlay.clientWidth;
    const cell = size / 8;
    // files along bottom
    for (let i = 0; i < 8; i++) {
        const s = document.createElement('span');
        s.textContent = files[i];
        s.className = 'coords-file';
        s.style.left = (cell * (i + 0.5)) + 'px';
        s.style.bottom = '4px';
        coordsOverlay.appendChild(s);
    }
    // ranks along left
    for (let j = 0; j < 8; j++) {
        const s = document.createElement('span');
        s.textContent = String(8 - j);
        s.className = 'coords-rank';
        s.style.left = '4px';
        s.style.bottom = (cell * (j + 0.5)) + 'px';
        coordsOverlay.appendChild(s);
    }
    coordsOverlay.dataset.show = 'true';
}

function updateCheckHighlight() {
    if (!checkToggle.checked) return;
    const color = engine.turn() === 'w' ? 'b' : 'w';
    const kingSq = engine.kingSquare(color);
    if (kingSq && engine.inCheck()) {
        board.highlightCheck(kingSq);
    }
}

function startTimer() {
    lastTick = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTick;
        lastTick = now;
        if (engine.turn() === 'w') {
            whiteTime -= delta;
        } else {
            blackTime -= delta;
        }
        renderTimers();
    }, 250);
}

function resetTimers() {
    whiteTime = 5 * 60 * 1000;
    blackTime = 5 * 60 * 1000;
    renderTimers();
}

function renderTimers() {
    timerWhiteEl.textContent = msToClock(Math.max(0, whiteTime));
    timerBlackEl.textContent = msToClock(Math.max(0, blackTime));
}

function msToClock(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (r < 10 ? '0' + r : r);
}


