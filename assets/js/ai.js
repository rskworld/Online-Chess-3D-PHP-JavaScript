/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

import { ChessEngine } from './chessEngine.js';

function evaluateMaterial(engine) {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const board = engine.getBoard();
    let score = 0;
    for (const rank of board) {
        for (const square of rank) {
            if (!square) continue;
            const v = pieceValues[square.type] || 0;
            score += square.color === 'w' ? v : -v;
        }
    }
    return score;
}

function minimax(engine, depth, maximizing) {
    if (depth === 0 || engine.isGameOver()) {
        return { score: evaluateMaterial(engine) };
    }
    const moves = engine.moves({ verbose: true });
    if (!moves.length) {
        return { score: evaluateMaterial(engine) };
    }

    let bestMove = null;
    if (maximizing) {
        let bestScore = -Infinity;
        for (const mv of moves) {
            const clone = engine.clone();
            clone.move({ from: mv.from, to: mv.to, promotion: 'q' });
            const result = minimax(clone, depth - 1, false);
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = mv;
            }
        }
        return { score: bestScore, move: bestMove };
    } else {
        let bestScore = Infinity;
        for (const mv of moves) {
            const clone = engine.clone();
            clone.move({ from: mv.from, to: mv.to, promotion: 'q' });
            const result = minimax(clone, depth - 1, true);
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = mv;
            }
        }
        return { score: bestScore, move: bestMove };
    }
}

export function findBestMove(engine, plyDepth) {
    const maximizing = engine.turn() === 'w';
    const { move } = minimax(engine, plyDepth, maximizing);
    return move || null;
}


