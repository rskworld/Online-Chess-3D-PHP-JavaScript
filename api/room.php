<?php
/**
 * Simple JSON-file room API (no Node/npm).
 * Stores state in storage/rooms/{room}.json
 *
 * For support: help@rskworld.in • +91 9330539277
 */

header('Content-Type: application/json');
header('Cache-Control: no-store');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = $method === 'POST' ? $_POST : $_GET;
// Support navigator.sendBeacon/text/plain bodies
if ($method === 'POST' && empty($_POST)) {
    $raw = file_get_contents('php://input');
    $fallback = [];
    if (is_string($raw) && strlen($raw) > 0) {
        parse_str($raw, $fallback);
        if (is_array($fallback)) {
            $input = $fallback + $_GET;
        }
    }
}

function resp($ok, $data = []) {
    echo json_encode(['ok' => $ok] + $data);
    exit;
}

function rooms_dir() {
    $dir = __DIR__ . '/../storage/rooms';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    return realpath($dir) ?: $dir;
}

function room_file($room) {
    $safe = preg_replace('/[^a-zA-Z0-9_-]/', '_', $room);
    return rooms_dir() . '/' . $safe . '.json';
}

function delete_room($room) {
    $file = room_file($room);
    if (file_exists($file)) @unlink($file);
}

function read_room($room) {
    $file = room_file($room);
    if (!file_exists($file)) return null;
    $fp = fopen($file, 'r');
    if (!$fp) return null;
    flock($fp, LOCK_SH);
    $json = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($json, true);
    return is_array($data) ? $data : null;
}

function write_room($room, $data) {
    $file = room_file($room);
    $fp = fopen($file, 'c+');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

$action = $input['action'] ?? '';
$room = $input['room'] ?? '';
if (!$action) resp(false, ['error' => 'missing_action']);
if (!$room) resp(false, ['error' => 'missing_room']);

$clientId = $input['clientId'] ?? null;

if ($action === 'create') {
    $state = read_room($room);
    if ($state) resp(true, ['exists' => true, 'rev' => $state['rev'], 'fen' => $state['fen'], 'history' => $state['history'], 'chat' => $state['chat'], 'gifts' => $state['gifts'], 'players' => $state['players'], 'names' => $state['names']]);
    $now = time();
    $state = [
        'id' => $room,
        'createdAt' => $now,
        'updatedAt' => $now,
        'rev' => 1,
        'fen' => null,
        'history' => [],
        'chat' => [],
        'gifts' => [],
        'players' => [ 'w' => null, 'b' => null ],
        'names' => [],
        'creator' => $clientId,
        'initialTimeMs' => 300000,
        'result' => null,
        'offer' => null,
        'score' => [ 'w' => 0, 'b' => 0 ],
        'game' => 1,
    ];
    write_room($room, $state);
    $side = 'w';
    if ($clientId) {
        $state['players']['w'] = $clientId;
        write_room($room, $state);
    }
    resp(true, ['side' => $side, 'rev' => $state['rev']]);
}

if ($action === 'join') {
    $state = read_room($room);
    if (!$state) {
        // auto-create
        $now = time();
        $state = [
            'id' => $room,
            'createdAt' => $now,
            'updatedAt' => $now,
            'rev' => 1,
            'fen' => null,
            'history' => [],
            'chat' => [],
            'gifts' => [],
            'players' => [ 'w' => null, 'b' => null ],
            'names' => [],
            'creator' => $clientId,
            'initialTimeMs' => 300000,
            'result' => null,
            'offer' => null,
            'score' => [ 'w' => 0, 'b' => 0 ],
            'game' => 1,
        ];
    }
    $side = 's';
    if ($clientId) {
        if (!$state['players']['w']) { $state['players']['w'] = $clientId; $side = 'w'; }
        else if (!$state['players']['b']) { $state['players']['b'] = $clientId; $side = 'b'; }
    }
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, [
        'side' => $side,
        'rev' => $state['rev'],
        'fen' => $state['fen'],
        'history' => $state['history'],
        'chat' => $state['chat'],
        'gifts' => $state['gifts'],
        'players' => $state['players'],
        'names' => $state['names']
    ]);
}

if ($action === 'leave') {
    $state = read_room($room);
    if ($state && $clientId) {
        if ($state['players']['w'] === $clientId) $state['players']['w'] = null;
        if ($state['players']['b'] === $clientId) $state['players']['b'] = null;
        $state['updatedAt'] = time();
        // If creator is leaving, delete room for privacy
        if (isset($state['creator']) && $state['creator'] === $clientId) {
            delete_room($room);
            resp(true, ['deleted' => true]);
        }
        // Auto-delete when empty (no players)
        if (empty($state['players']['w']) && empty($state['players']['b'])) {
            delete_room($room);
            resp(true, ['deleted' => true]);
        }
        write_room($room, $state);
    }
    resp(true, []);
}

if ($action === 'move') {
    $from = $input['from'] ?? null;
    $to = $input['to'] ?? null;
    $fen = $input['fen'] ?? null;
    if (!$from || !$to || !$fen) resp(false, ['error' => 'missing_move_data']);
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    $state['history'][] = [ 'from' => $from, 'to' => $to, 'by' => $clientId, 't' => time() ];
    $state['fen'] = $fen;
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'offer') {
    $kind = $input['kind'] ?? '';
    if (!in_array($kind, ['draw','rematch','resign'], true)) resp(false, ['error' => 'bad_offer']);
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    $state['offer'] = [ 'kind' => $kind, 'by' => $clientId, 't' => time() ];
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'accept_offer') {
    $state = read_room($room);
    if (!$state || !$state['offer']) resp(false, ['error' => 'no_offer']);
    $offer = $state['offer'];
    if ($offer['kind'] === 'draw') {
        $state['result'] = '1/2-1/2';
    } else if ($offer['kind'] === 'resign') {
        // winner is opposite of who offered
        $winner = ($state['players']['w'] === $offer['by']) ? 'b' : 'w';
        $state['result'] = ($winner === 'w') ? '1-0' : '0-1';
        $state['score'][$winner] = intval($state['score'][$winner]) + 1;
    } else if ($offer['kind'] === 'rematch') {
        $state['game'] = intval($state['game']) + 1;
        $state['history'] = [];
        $state['fen'] = null;
        $state['result'] = null;
    }
    $state['offer'] = null;
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'chat') {
    $text = trim($input['text'] ?? '');
    if ($text === '') resp(false, ['error' => 'empty']);
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    $state['chat'][] = [ 'by' => $clientId, 'text' => $text, 't' => time() ];
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'name') {
    $name = trim($input['name'] ?? '');
    if ($name === '') resp(false, ['error' => 'empty_name']);
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    if (!isset($state['names']) || !is_array($state['names'])) $state['names'] = [];
    $state['names'][$clientId] = mb_substr($name, 0, 40);
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'gift') {
    $gift = trim($input['gift'] ?? '');
    if ($gift === '') resp(false, ['error' => 'empty_gift']);
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    if (!isset($state['gifts']) || !is_array($state['gifts'])) $state['gifts'] = [];
    $state['gifts'][] = [ 'gift' => $gift, 'by' => $clientId, 't' => time() ];
    $state['rev'] = intval($state['rev']) + 1;
    $state['updatedAt'] = time();
    write_room($room, $state);
    resp(true, ['rev' => $state['rev']]);
}

if ($action === 'state') {
    $state = read_room($room);
    if (!$state) resp(false, ['error' => 'room_not_found']);
    $since = isset($input['since']) ? intval($input['since']) : 0;
    if ($since > 0 && $state['rev'] <= $since) {
        resp(true, ['noop' => true, 'rev' => $state['rev']]);
    } else {
        resp(true, [
            'rev' => $state['rev'],
            'fen' => $state['fen'],
            'history' => $state['history'],
            'chat' => $state['chat'],
            'gifts' => $state['gifts'],
            'players' => $state['players'],
            'names' => $state['names'],
            'result' => $state['result'],
            'offer' => $state['offer'],
            'score' => $state['score'],
            'game' => $state['game'],
            'initialTimeMs' => $state['initialTimeMs']
        ]);
    }
}

if ($action === 'list') {
    $dir = rooms_dir();
    $rooms = [];
    foreach (glob($dir . '/*.json') as $file) {
        $json = @file_get_contents($file);
        $data = @json_decode($json, true);
        if (is_array($data)) {
            $rooms[] = [
                'id' => $data['id'] ?? basename($file, '.json'),
                'rev' => intval($data['rev'] ?? 0),
                'updatedAt' => intval($data['updatedAt'] ?? filemtime($file)),
                'hasFen' => !empty($data['fen'])
            ];
        }
    }
    resp(true, ['rooms' => $rooms]);
}

resp(false, ['error' => 'unknown_action']);


