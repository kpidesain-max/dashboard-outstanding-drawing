<?php
// API read-only.
// Data dibuat GitHub Actions dan di-upload ke /htdocs/data/db.json.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_set_cookie_params(array('path' => '/'));
session_start();
define('DATA_DIR', dirname(__DIR__) . '/data');

function send_json($code, $data)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function load_db()
{
    $file = DATA_DIR . '/db.json';

    if (is_file($file)) {
        $content = file_get_contents($file);
        $data = json_decode($content, true);

        if (is_array($data)) {
            return $data;
        }
    }

    return array(
        'projects' => array(),
        'drawings' => array(
            'generated' => '',
            'rows' => array(),
            'errors' => array()
        ),
        'hps' => array(
            'generated' => '',
            'rows' => array()
        )
    );
}

function load_projects()
{
    $data = load_db();
    $projects = array();

    if (!isset($data['projects']) || !is_array($data['projects'])) {
        return $projects;
    }

    foreach ($data['projects'] as $id => $project) {
        if (is_array($project)) {
            $project['id'] = $id;
            $projects[] = $project;
        }
    }

    /* Gabungkan override progress dari projects.json (dibuat admin) */
    $proj_file = DATA_DIR . '/projects.json';
    if (is_file($proj_file)) {
        $override = json_decode((string)file_get_contents($proj_file), true);
        if (is_array($override)) {
            $map = array();
            foreach ($projects as $idx => $proj) {
                $map[$proj['id']] = $idx;
            }
            foreach ($override as $id => $ov) {
                if (isset($map[$id]) && is_array($ov)) {
                    $idx = $map[$id];
                    $projects[$idx] = array_merge($projects[$idx], $ov);
                }
            }
        }
    }

    usort($projects, 'sort_projects');

    return $projects;
}

function sort_projects($a, $b)
{
    $order_a = isset($a['o']) ? (int) $a['o'] : 0;
    $order_b = isset($b['o']) ? (int) $b['o'] : 0;

    if ($order_a == $order_b) {
        return 0;
    }

    return ($order_a < $order_b) ? -1 : 1;
}

function format_last_update($value)
{
    if (empty($value)) return '';
    $date = date_create($value, new DateTimeZone('Asia/Jakarta'));
    if ($date === false) return '';
    $date->setTimezone(new DateTimeZone('Asia/Jakarta'));
    return 'Update terakhir: ' . $date->format('d/m/Y H:i') . ' WIB';
}

$method = isset($_SERVER['REQUEST_METHOD'])
    ? $_SERVER['REQUEST_METHOD']
    : 'GET';

$request_uri = isset($_SERVER['REQUEST_URI'])
    ? $_SERVER['REQUEST_URI']
    : '/';

$path = parse_url($request_uri, PHP_URL_PATH);

if ($method === 'GET' && $path === '/api/state') {
    $data = load_db();

    $drawings = isset($data['drawings'])
        ? $data['drawings']
        : array(
            'generated' => '',
            'rows' => array(),
            'errors' => array()
        );

    $hps = isset($data['hps'])
        ? $data['hps']
        : array(
            'generated' => '',
            'rows' => array()
        );

    $last_update = format_last_update($data['generated'] ?? '');
    if (empty($last_update) && isset($drawings['generated'])) {
        $last_update = format_last_update($drawings['generated']);
    }

    $recap = isset($data['recap'])
        ? $data['recap']
        : array();

    send_json(200, array(
        'projects' => load_projects(),
        'drawings' => $drawings,
        'hps' => $hps,
        'recap' => $recap,
        'last_update' => $last_update,
        'generated' => $data['generated'] ?? $drawings['generated'] ?? ''
    ));
}

/* ---- /api/projects endpoint (admin-only mutations) ---- */
$path = parse_url($request_uri, PHP_URL_PATH);
$admin_ok = !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

if (preg_match('#^/api/projects(/.*)?$#', $path)) {
    $proj_file = DATA_DIR . '/projects.json';
    $projects = array();
    if (is_file($proj_file)) {
        $raw = file_get_contents($proj_file);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $projects = $decoded;
    }

    if ($method === 'GET') {
        send_json(200, $projects);
    }

    if (!$admin_ok) {
        send_json(401, array('error' => 'Admin login diperlukan untuk mengubah data proyek'));
    }

    $input = file_get_contents('php://input');
    $data_in = json_decode($input, true);
    if (!is_array($data_in)) $data_in = array();

    $segments = explode('/', trim(preg_replace('#^/api/projects(?:/|$)(.*)$#', '$1', $path), '/'));

    if ($method === 'POST') {
        $id = $data_in['id'] ?? ('p' . count($projects));
        $projects[$id] = $data_in;
        @file_put_contents($proj_file, json_encode($projects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        send_json(200, array('status' => 'ok', 'id' => $id));
    }

    if ($method === 'PATCH' && isset($segments[0])) {
        $id = $segments[0];
        if (isset($projects[$id])) {
            $projects[$id] = array_merge($projects[$id], $data_in);
            @file_put_contents($proj_file, json_encode($projects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            send_json(200, array('status' => 'ok', 'id' => $id));
        }
        send_json(404, array('error' => 'Proyek tidak ditemukan'));
    }

    if ($method === 'DELETE' && isset($segments[0])) {
        $id = $segments[0];
        if (isset($projects[$id])) {
            unset($projects[$id]);
            @file_put_contents($proj_file, json_encode($projects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            send_json(200, array('status' => 'ok'));
        }
        send_json(404, array('error' => 'Proyek tidak ditemukan'));
    }
}

send_json(404, array(
    'error' => 'Endpoint tidak ditemukan'
));