/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

import { Chess } from 'https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';

export class ChessEngine {
    constructor(fen) {
        this.game = new Chess(fen);
    }

    reset() {
        this.game = new Chess();
    }

    getFen() {
        return this.game.fen();
    }

    turn() {
        return this.game.turn(); // 'w' | 'b'
    }

    moves(options = {}) {
        return this.game.moves(options);
    }

    legalMovesFrom(square) {
        return this.game.moves({ square, verbose: true });
    }

    move({ from, to, promotion = 'q' }) {
        try {
            const result = this.game.move({ from, to, promotion });
            return result || null;
        } catch (e) {
            return null;
        }
    }

    undo() { return this.game.undo(); }

    pgn() { return this.game.pgn(); }

    isGameOver() {
        return this.game.isGameOver();
    }

    inCheckmate() { return this.game.isCheckmate(); }
    inStalemate() { return this.game.isStalemate(); }
    inDraw() { return this.game.isDraw(); }
    inCheck() { return this.game.isCheck(); }

    getBoard() {
        return this.game.board();
    }

    clone() {
        return new ChessEngine(this.getFen());
    }

    load(fen) {
        return this.game.load(fen);
    }

    historyVerbose() {
        return this.game.history({ verbose: true });
    }

    kingSquare(color) {
        const board = this.getBoard();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = board[r][c];
                if (sq && sq.type === 'k' && sq.color === color) {
                    const file = 'abcdefgh'[c];
                    const rank = 8 - r;
                    return file + rank;
                }
            }
        }
        return null;
    }
}


