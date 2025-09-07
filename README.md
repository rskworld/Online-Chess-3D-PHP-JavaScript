# Online Chess 3D (PHP + JavaScript)

A modern, 3D chess game with AI, animations, sound, and internet multiplayer using a simple PHP JSON-file backend (no Node/npm required).

## Features
- 3D board and pieces (Three.js) with smooth move animations (GSAP)
- Legal moves and rules (Chess.js)
- Sound effects (Howler)
- Themes (Classic/Wood/Neon), coordinates, check/last-move highlights
- Timers, captured pieces list, hints, save/load (local)
- Multiplayer over the internet via PHP file-based rooms
  - Create/Join/Leave room, chat, gifts (animated emoji)
  - Player names and side assignment (auto-flip board for Black)
  - Draw/Resign/Rematch offers and game result tracking
  - Auto-delete room JSON when creator leaves or when room is empty

## Requirements
- PHP 7.4+ (or higher) running under your web server (e.g., Laragon, XAMPP, Apache+PHP)
- Write permissions for the folder: `game/storage/rooms`
- Modern browser with WebGL and ES modules enabled
- Internet access for CDN libraries (Three.js, GSAP, Howler, Google Fonts)

## Project Structure
- `index.php` – Main UI (3D board, controls, multiplayer panel)
- `assets/js/`
  - `main.js` – App wiring (UI, engine, multiplayer, timers, gifts)
  - `board3d.js` – Three.js board/pieces, highlights, animations
  - `chessEngine.js` – Chess.js wrapper
  - `ai.js` – Simple minimax AI (single player only)
  - `realtime-file.js` – PHP polling client for JSON rooms
- `assets/css/styles.css` – Custom styles (coordinates overlay, layout tweaks)
- `assets/img/chess.svg` – App icon
- `api/room.php` – PHP API (create/join/state/list/move/chat/name/gift/offer/accept_offer/leave)
- `storage/rooms/` – Room JSON files (auto-created; must be writable)
- `includes/constants.php`, `includes/footer.php` – Shared contact/footer
- `server/realtime-server.js` – Optional Node WebSocket server (not required)

## Quick Start (Laragon/Windows)
1. Place the project under: `[Demo](https://rskworld.in/games/html5-games/chess/index.php)`
2. Ensure the folder exists and is writable: `game/storage/rooms`
   - If not present, it will be auto-created; otherwise create it manually
3. Visit in your browser:
   - `[Demo](https://rskworld.in/games/html5-games/chess/index.php)`
4. Single player: choose difficulty, click squares to move
5. Multiplayer:
   - In Browser A, enter a Room ID, click “Create”, then “Set Name”
   - In Browser B, enter the same Room ID, click “Join”, then “Set Name”
   - The second user is assigned Black and the board flips automatically
   - Moves, chat, and gifts sync in real time

## Multiplayer API (PHP JSON rooms)
- Rooms are stored as JSON under `storage/rooms/{room}.json`
- Key endpoints (all return JSON):
  - `GET/POST api/room.php?action=list`
  - `POST api/room.php` with `action=create|join|leave|move|chat|name|gift|offer|accept_offer|state`
- Minimal manual tests (open in browser):
  - List rooms: `/api/room.php?action=list`
  - Room state: `/api/room.php?action=state&room=TEST`

## Production Notes
- Tailwind via CDN is fine for development. For production, build Tailwind CSS locally (PostCSS/CLI) to avoid CDN warnings.
- ESM modules are loaded via an import map in `index.php`. Ensure your site is served over HTTP(S), not `file://`.

## Troubleshooting
- Board not rendering / blank canvas:
  - Ensure browser supports WebGL and ES modules; check console for import errors
  - Confirm internet access for CDNs
- Pieces appear sunk below board:
  - Fixed in `board3d.js` (piece Y offsets); hard-refresh (Ctrl+F5)
- Multiplayer not syncing:
  - Verify the API returns JSON: `/api/room.php?action=list` and `/api/room.php?action=state&room=YOUR_ROOM`
  - Ensure `storage/rooms` is writable by the web server user
  - Use the app via `http://` or `https://`, not `file://`
- Room not deleted on close:
  - Creator’s leave triggers deletion; we also send a leave beacon on tab close/hidden. Confirm folder permissions

## Optional: Node WebSocket Server (not required)
If you prefer websockets instead of PHP polling, there’s a simple server in `server/realtime-server.js` (for development tests):
```bash
npm i ws
node server/realtime-server.js
```
Update the client to use the WS client instead of the PHP polling client. This is optional and not needed for the PHP-only setup.

## Support & Contact
For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277

Website: RSK World • Business Inquiries: help@rskworld.in

🤝 Contributing: Suggestions and improvements are welcome!

## License
© RSK World. All rights reserved unless otherwise stated.

