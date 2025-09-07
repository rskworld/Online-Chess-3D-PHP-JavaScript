<?php
/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

require_once __DIR__ . '/includes/constants.php';
?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Online Chess • 3D</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link rel="icon" type="image/svg+xml" href="assets/img/chess.svg" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="assets/css/styles.css" />
    <meta name="description" content="3D Chess with AI and online multiplayer-ready scaffold." />
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js",
            "three/examples/jsm/controls/OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js"
        }
    }
    </script>
</head>
<body class="min-h-screen bg-slate-900 text-slate-100" style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
    <div class="max-w-7xl mx-auto px-4 py-6">
        <header class="mb-6">
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Online Chess <span class="text-emerald-400">3D</span></h1>
            <p class="text-slate-300 mt-2">Multiplayer-ready with AI, animations, and sound.</p>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section class="lg:col-span-3 bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                <div id="board-container" class="aspect-square w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative">
                    <!-- 3D canvas injected here -->
                    <div id="coords-overlay" class="pointer-events-none absolute inset-0"></div>
                </div>
            </section>

            <aside class="lg:col-span-2 space-y-4">
                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Multiplayer</h2>
                    <div class="mt-3 grid grid-cols-1 gap-3">
                        <div class="grid grid-cols-2 gap-2">
                            <input id="roomId" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1" placeholder="Room ID" />
                            <input id="playerName" class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1" placeholder="Your name" />
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="createRoomBtn" class="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">Create</button>
                            <button id="joinRoomBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Join</button>
                            <button id="leaveRoomBtn" class="px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white">Leave</button>
                            <button id="setNameBtn" class="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Set Name</button>
                        </div>
                        <div id="mpStatus" class="text-sm text-slate-400">Not connected</div>
                        <div class="flex items-center gap-3 text-sm text-slate-300">
                            <span id="whiteName" class="inline-flex items-center gap-1"><span>♔</span> <span>White</span></span>
                            <span id="blackName" class="inline-flex items-center gap-1"><span>♚</span> <span>Black</span></span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button id="offerDrawBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Offer Draw</button>
                            <button id="resignBtn" class="px-3 py-2 rounded-md bg-rose-700 hover:bg-rose-800 text-white">Resign</button>
                            <button id="rematchBtn" class="px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white">Rematch</button>
                            <button id="copyLinkBtn" class="px-3 py-2 rounded-md bg-sky-700 hover:bg-sky-800 text-white">Copy Link</button>
                        </div>
                        <div class="grid grid-cols-1 gap-2">
                            <div class="flex gap-2">
                                <input id="chatInput" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1" placeholder="Type a message"/>
                                <button id="chatSendBtn" class="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white">Send</button>
                            </div>
                            <div id="chatLog" class="h-28 overflow-auto text-sm bg-slate-900 border border-slate-700 rounded p-2"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <select id="giftSelect" class="bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                <option value="👏">Applause 👏</option>
                                <option value="🔥">Fire 🔥</option>
                                <option value="💎">Gem 💎</option>
                                <option value="🎉">Party 🎉</option>
                                <option value="🏆">Trophy 🏆</option>
                            </select>
                            <button id="giftSendBtn" class="px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white">Send Gift</button>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Game Controls</h2>
                    <div class="mt-3 flex flex-wrap items-center gap-3">
                        <button id="newGameBtn" class="px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white">New Game</button>
                        <button id="undoBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Undo</button>
                        <button id="flipBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Flip Board</button>
                        <label class="text-sm text-slate-300">Difficulty
                            <select id="difficulty" class="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                <option value="0">Easy</option>
                                <option value="1">Medium</option>
                                <option value="2">Hard</option>
                            </select>
                        </label>
                        <label class="text-sm text-slate-300">Play as
                            <select id="playAs" class="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                <option value="w">White</option>
                                <option value="b">Black</option>
                            </select>
                        </label>
                        <label class="text-sm text-slate-300">View
                            <select id="viewSelect" class="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                <option value="iso">Isometric</option>
                                <option value="top">Top-down</option>
                            </select>
                        </label>
                        <label class="text-sm text-slate-300 inline-flex items-center gap-2 ml-2">
                            <input id="soundToggle" type="checkbox" class="accent-emerald-500" checked /> Sound
                        </label>
                        <label class="text-sm text-slate-300 inline-flex items-center gap-2 ml-2">
                            <input id="animToggle" type="checkbox" class="accent-emerald-500" checked /> Animations
                        </label>
                        <label class="text-sm text-slate-300">Theme
                            <select id="themeSelect" class="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                                <option value="classic">Classic</option>
                                <option value="wood">Wood</option>
                                <option value="neon">Neon</option>
                            </select>
                        </label>
                        <label class="text-sm text-slate-300 inline-flex items-center gap-2 ml-2">
                            Volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.4" class="align-middle" />
                        </label>
                        <label class="text-sm text-slate-300 inline-flex items-center gap-2 ml-2">
                            <input id="coordsToggle" type="checkbox" class="accent-emerald-500" checked /> Coordinates
                        </label>
                        <label class="text-sm text-slate-300 inline-flex items-center gap-2 ml-2">
                            <input id="checkToggle" type="checkbox" class="accent-emerald-500" checked /> Highlight Check
                        </label>
                        <button id="hintBtn" class="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Hint</button>
                        <button id="exportBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Export PGN</button>
                        <button id="saveBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Save</button>
                        <button id="loadBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Load</button>
                        <button id="resetCameraBtn" class="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white">Reset Camera</button>
                        <button id="fsBtn" class="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white">Fullscreen</button>
                    </div>
                </div>

                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Status</h2>
                    <div id="status" class="mt-2 text-slate-300">Ready.</div>
                </div>

                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Timers</h2>
                    <div class="mt-2 grid grid-cols-2 gap-3">
                        <div class="p-3 rounded-md bg-slate-900 border border-slate-700">
                            <div class="text-xs text-slate-400">White</div>
                            <div id="timerWhite" class="text-2xl font-mono">05:00</div>
                        </div>
                        <div class="p-3 rounded-md bg-slate-900 border border-slate-700">
                            <div class="text-xs text-slate-400">Black</div>
                            <div id="timerBlack" class="text-2xl font-mono">05:00</div>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Moves</h2>
                    <ol id="moves" class="mt-2 text-slate-300 list-decimal list-inside max-h-64 overflow-auto"></ol>
                </div>

                <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                    <h2 class="font-semibold text-lg">Captured</h2>
                    <div class="mt-2 grid grid-cols-2 gap-3 text-2xl">
                        <div>
                            <div class="text-xs text-slate-400">White captures</div>
                            <div id="capturedWhite" class="min-h-[28px]"></div>
                        </div>
                        <div>
                            <div class="text-xs text-slate-400">Black captures</div>
                            <div id="capturedBlack" class="min-h-[28px]"></div>
                        </div>
                    </div>
                </div>

                
            </aside>
        </main>

        <?php require __DIR__ . '/includes/footer.php'; ?>
    </div>

    <div id="error-overlay" class="hidden fixed inset-0 z-50 bg-black/80">
        <div class="max-w-3xl mx-auto p-4">
            <div class="bg-slate-900 border border-red-700 rounded-lg p-4">
                <h3 class="text-lg font-bold text-red-300">An error occurred</h3>
                <pre id="error-text" class="mt-2 text-red-200 whitespace-pre-wrap"></pre>
                <button id="error-close" class="mt-3 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white">Close</button>
            </div>
        </div>
    </div>

    
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
    <script type="module" src="assets/js/main.js"></script>
</body>
</html>


