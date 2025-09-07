/**
 * For support, licensing, or custom development inquiries: help@rskworld.in • Phone/WhatsApp: +91 9330539277
 * Website: RSK World • Business Inquiries: help@rskworld.in
 * 🤝 Contributing: Suggestions and improvements are welcome!
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FILES = ['a','b','c','d','e','f','g','h'];

function squareFromCoords(x, z) {
    // z=0 is far (rank 8), z=7 is near (rank 1)
    return FILES[x] + (8 - z);
}

function coordsFromSquare(square) {
    const file = square[0];
    const rank = parseInt(square[1], 10);
    // rank 1 -> z=7 (near), rank 8 -> z=0 (far)
    return { x: FILES.indexOf(file), z: 8 - rank };
}

export class Board3D {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b1220);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(4, 9.5, 9.5);
        this.camera.lookAt(new THREE.Vector3(4, 0, 4));

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(4, 0, 4);
        this.controls.minDistance = 6;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI * 0.49;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.squareClickHandlers = [];

        this.squareMeshes = new Map();
        this.pieceMeshes = new Map();
        this.lastMoveSquares = null;
        this.animationsEnabled = true;
        this.isFlipped = false;

        this._createLights();
        this._createBoard();
        this._bindEvents();
        this._animate();
        this._handleResize = () => this._onResize();
        window.addEventListener('resize', this._handleResize);
    }

    dispose() {
        window.removeEventListener('resize', this._handleResize);
        this.controls?.dispose?.();
        this.renderer?.dispose?.();
    }

    _createLights() {
        const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 0.6);
        this.scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(6, 10, 6);
        dir.castShadow = true;
        this.scene.add(dir);
    }

    _createBoard() {
        const boardGroup = new THREE.Group();
        const dark = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: .2, roughness: .8 });
        const light = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: .2, roughness: .8 });
        const highlight = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: .4, roughness: .4, emissive: 0x065f46, emissiveIntensity: .3 });
        const lastMove = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: .3, roughness: .5, emissive: 0x78350f, emissiveIntensity: .25 });
        this.squareMaterials = { dark, light, highlight, lastMove };

        const squareGeo = new THREE.BoxGeometry(1, 0.1, 1);
        for (let z = 0; z < 8; z++) {
            for (let x = 0; x < 8; x++) {
                const isDark = (x + z) % 2 === 1;
                const mat = isDark ? dark.clone() : light.clone();
                const mesh = new THREE.Mesh(squareGeo, mat);
                mesh.receiveShadow = true;
                // center board around origin for correct rotation pivot
                mesh.position.set(x - 3.5, -0.05, z - 3.5);
                mesh.userData.square = squareFromCoords(x, z);
                this.squareMeshes.set(mesh.userData.square, mesh);
                boardGroup.add(mesh);
            }
        }

        // Base frame
        const frameGeo = new THREE.BoxGeometry(9.2, 0.2, 9.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: .6, roughness: .3 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        // centered frame
        frame.position.set(0, -0.16, 0);
        frame.castShadow = false;
        frame.receiveShadow = true;
        boardGroup.add(frame);

        // place whole board at world center (4,0,4)
        boardGroup.position.set(4, 0, 4);
        this.scene.add(boardGroup);
        this.boardGroup = boardGroup;
        // group to hold pieces so flipping affects them
        this.piecesGroup = new THREE.Group();
        this.boardGroup.add(this.piecesGroup);
    }

    _bindEvents() {
        this.renderer.domElement.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    }

    _onResize() {
        const w = this.container.clientWidth || this.width;
        const h = this.container.clientHeight || this.height;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    _onPointerDown(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersects = this.raycaster.intersectObjects([
            ...this.boardGroup.children,
            ...Array.from(this.pieceMeshes.values())
        ], false);
        if (intersects.length) {
            const obj = intersects[0].object;
            const sq = obj.userData.square;
            if (sq) {
                this.squareClickHandlers.forEach(cb => cb(sq));
            }
        }
    }

    onSquareSelected(cb) {
        this.squareClickHandlers.push(cb);
    }

    clearHighlights() {
        for (const [sq, mesh] of this.squareMeshes) {
            const { x, z } = coordsFromSquare(sq);
            const isDark = (x + z) % 2 === 1;
            mesh.material = (isDark ? this.squareMaterials.dark : this.squareMaterials.light).clone();
        }
        if (this.lastMoveSquares) {
            const [a, b] = this.lastMoveSquares;
            if (a && this.squareMeshes.get(a)) this.squareMeshes.get(a).material = this.squareMaterials.lastMove.clone();
            if (b && this.squareMeshes.get(b)) this.squareMeshes.get(b).material = this.squareMaterials.lastMove.clone();
        }
    }

    highlightSquares(squares) {
        this.clearHighlights();
        for (const sq of squares) {
            const mesh = this.squareMeshes.get(sq);
            if (mesh) mesh.material = this.squareMaterials.highlight.clone();
        }
    }

    highlightCheck(square) {
        if (!square) return;
        const mesh = this.squareMeshes.get(square);
        if (mesh) {
            const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: .4, roughness: .4, emissive: 0x7f1d1d, emissiveIntensity: .35 });
            mesh.material = mat;
        }
    }

    applyTheme(theme) {
        let darkColor = 0x334155, lightColor = 0xe2e8f0;
        if (theme === 'wood') { darkColor = 0x8b5a2b; lightColor = 0xf3e7d3; }
        if (theme === 'neon') { darkColor = 0x1f2937; lightColor = 0x0ea5e9; }
        for (const [sq, mesh] of this.squareMeshes) {
            const { x, z } = coordsFromSquare(sq);
            const isDark = (x + z) % 2 === 1;
            const color = isDark ? darkColor : lightColor;
            mesh.material.color = new THREE.Color(color);
        }
    }

    _pieceColorAndType(ch) {
        const isUpper = ch === ch.toUpperCase();
        const color = isUpper ? 'w' : 'b';
        const type = ch.toLowerCase();
        return { color, type };
    }

    _createPieceMesh(ch, square) {
        const { color, type } = this._pieceColorAndType(ch);
        const baseColor = color === 'w' ? 0xf8fafc : 0x0ea5e9; // slate-50 / sky-500
        const accent = color === 'w' ? 0x94a3b8 : 0x0369a1;
        const group = new THREE.Group();

        const add = (mesh) => { mesh.castShadow = true; mesh.receiveShadow = false; group.add(mesh); };
        const baseY = 0.0; // board top is y=0
        if (type === 'p') {
            const cylH = 0.35;
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, cylH, 24), new THREE.MeshStandardMaterial({ color: baseColor }));
            cyl.position.y = baseY + cylH / 2;
            add(cyl);
            const sph = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: baseColor }));
            sph.position.y = baseY + cylH + 0.22;
            add(sph);
        } else if (type === 'r') {
            const bodyH = 0.5;
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, bodyH, 0.6), new THREE.MeshStandardMaterial({ color: baseColor }));
            body.position.y = baseY + bodyH / 2;
            add(body);
            const crownH = 0.1;
            const crown = new THREE.Mesh(new THREE.BoxGeometry(0.7, crownH, 0.7), new THREE.MeshStandardMaterial({ color: accent }));
            crown.position.y = baseY + bodyH + crownH / 2;
            add(crown);
        } else if (type === 'n') {
            const baseH = 0.2;
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, baseH, 24), new THREE.MeshStandardMaterial({ color: accent }));
            base.position.y = baseY + baseH / 2;
            add(base);
            const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.18, 0.06, 64, 8, 2, 3), new THREE.MeshStandardMaterial({ color: baseColor }));
            knot.position.y = baseY + baseH + 0.15;
            add(knot);
        } else if (type === 'b') {
            const coneH = 0.8;
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, coneH, 24), new THREE.MeshStandardMaterial({ color: baseColor }));
            cone.position.y = baseY + coneH / 2;
            add(cone);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 12, 24), new THREE.MeshStandardMaterial({ color: accent }));
            ring.position.y = baseY + 0.3;
            add(ring);
        } else if (type === 'q') {
            const bodyH = 0.7;
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, bodyH, 24), new THREE.MeshStandardMaterial({ color: baseColor }));
            body.position.y = baseY + bodyH / 2;
            add(body);
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: accent }));
            orb.position.y = baseY + bodyH + 0.22;
            add(orb);
        } else if (type === 'k') {
            const bodyH = 0.7;
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.34, bodyH, 24), new THREE.MeshStandardMaterial({ color: baseColor }));
            body.position.y = baseY + bodyH / 2;
            add(body);
            const crossY = baseY + bodyH + 0.2;
            const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: accent }));
            crossV.position.y = crossY;
            const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: accent }));
            crossH.position.y = crossY;
            add(crossV); add(crossH);
        }

        const { x, z } = coordsFromSquare(square);
        group.position.set(x - 3.5, 0.0, z - 3.5);
        group.userData.square = square;
        return group;
    }

    updatePosition(fen) {
        for (const mesh of this.pieceMeshes.values()) {
            this.piecesGroup.remove(mesh);
        }
        this.pieceMeshes.clear();

        const piecePlacement = fen.split(' ')[0];
        const ranks = piecePlacement.split('/');
        // FEN ranks from 8 -> 1, our z from 7 -> 0
        for (let fenRank = 0; fenRank < 8; fenRank++) {
            const row = ranks[fenRank];
            let fileIndex = 0;
            for (const ch of row) {
                if (/[1-8]/.test(ch)) {
                    fileIndex += parseInt(ch, 10);
                } else {
                    const file = FILES[fileIndex];
                    const rank = 8 - fenRank; // rank number
                    const square = file + String(rank);
                    const mesh = this._createPieceMesh(ch, square);
                    this.piecesGroup.add(mesh);
                    this.pieceMeshes.set(square, mesh);
                    fileIndex += 1;
                }
            }
        }
    }

    animateMove(from, to) {
        const moving = this.pieceMeshes.get(from);
        const captured = this.pieceMeshes.get(to);
        const { x, z } = coordsFromSquare(to);
        const dx = x - 3.5;
        const dz = z - 3.5;
        if (!moving) return;

        if (captured) {
            // fade captured
            const tl = (window.gsap && window.gsap.timeline()) || null;
            if (tl) {
                tl.to(captured.position, { y: -0.8, duration: 0.2 });
                tl.to(captured, { opacity: 0, duration: 0.2, onComplete: () => {
                    this.piecesGroup.remove(captured);
                } }, '<');
            } else {
                this.piecesGroup.remove(captured);
            }
            this.pieceMeshes.delete(to);
        }

        const tl = (window.gsap && window.gsap.timeline() && this.animationsEnabled) ? window.gsap.timeline() : null;
        if (tl) {
            tl.to(moving.position, { y: 0.6, duration: 0.18, ease: 'sine.out' });
            tl.to(moving.position, { x: dx, z: dz, duration: 0.28, ease: 'power2.inOut' });
            tl.to(moving.position, { y: 0.0, duration: 0.18, ease: 'sine.in' });
            // impact pulse on destination square
            const squareMesh = this.squareMeshes.get(to);
            if (squareMesh) {
                const original = squareMesh.material.emissiveIntensity;
                tl.to(squareMesh.material, { emissiveIntensity: 0.8, duration: 0.12 }, '<');
                tl.to(squareMesh.material, { emissiveIntensity: original ?? 0.0, duration: 0.25 });
            }
        } else {
            moving.position.set(dx, 0, dz);
        }
        moving.userData.square = to;
        this.pieceMeshes.delete(from);
        this.pieceMeshes.set(to, moving);
    }

    _animate() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this._animate());
    }
}

export function createBoard3D(container) {
    return new Board3D(container);
}

// Additional API
Board3D.prototype.setAnimationsEnabled = function(enabled) {
    this.animationsEnabled = !!enabled;
};

Board3D.prototype.setLastMove = function(from, to) {
    this.lastMoveSquares = from && to ? [from, to] : null;
    this.clearHighlights();
};

Board3D.prototype.setFlipped = function(flipped) {
    this.isFlipped = !!flipped;
    this.boardGroup.rotation.y = this.isFlipped ? Math.PI : 0;
};

Board3D.prototype.setView = function(view) {
    if (view === 'top') {
        this.camera.position.set(4, 15, 4);
        this.controls.target.set(4, 0, 4);
        this.controls.update();
    } else {
        this.camera.position.set(4, 9.5, 9.5);
        this.controls.target.set(4, 0, 4);
        this.controls.update();
    }
};

Board3D.prototype.resetCamera = function() {
    this.setView('iso');
    this.setFlipped(this.isFlipped);
};


