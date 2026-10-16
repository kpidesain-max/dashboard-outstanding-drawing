<?php
// API read-only; data dihasilkan GitHub Actions dan disimpan di /htdocs/data/db.json.
declare(strict_types=1);
const DATA_DIR = __DIR__ . '/../data';
function send_json(int $code, array $obj): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($obj, JSON_UNESCAPED_UNICODE);
    exit;
}
function load_db(): array {
    $db = DATA_DIR . '/db.json';
    if (is_file($db)) {
        $j = json_decode((string) file_get_contents($db), true);
        if (is_array($j)) return $j;
    }
    return ['projects'=>[], 'drawings'=>['generated'=>'','rows'=>[],'errors'=>[]], 'hps'=>['generated'=>'','rows'=>[]]];
}
function load_projects(): array {
    $d = load_db(); $out = [];
    foreach ($d['projects'] ?? [] as $id => $v) $out[] = array_merge(['id'=>$id], (array)$v);
    usort($out, fn($a,$b) => ($a['o'] ?? 0) <=> ($b['o'] ?? 0));
    return $out;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if ($method === 'GET' && $path === '/api/state') {
    $d = load_db();
    send_json(200, ['projects'=>load_projects(), 'drawings'=>$d['drawings'] ?? null, 'hps'=>$d['hps'] ?? null]);
}
send_json(404, ['error'=>'Tidak ditemukan']);
