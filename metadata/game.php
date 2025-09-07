<?php
/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

return [
    [
        'id' => 'chess',
        'title' => 'Online Chess',
        'description' => 'Multiplayer chess game with AI opponent and online play.',
        'image' => 'assets/img/chess.svg',
        'link' => 'index.php',
        'technologies' => [
            'JavaScript', 'HTML5', 'Three.js', 'Chess.js', 'GSAP', 'Howler.js', 'TailwindCSS'
        ],
        'difficulty' => 'Advanced',
        'rating' => 5,
        'category' => 'strategy',
        'tags' => ['Multiplayer', 'Board Game', '3D'],
        'features' => [
            '3D Chessboard (Three.js)',
            'AI Opponent (Chess.js)',
            'Online Multiplayer-ready (WebSocket scaffold)',
            'Real-time Moves',
            'Difficulty Levels',
            'Sound & Animations (Howler, GSAP)'
        ],
    ],
];


