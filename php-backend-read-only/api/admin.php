<?php
// api/admin.php — Admin login gate (password: admin)
session_set_cookie_params(array('path' => '/'));
session_start();
header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'login') {
    $pass = $_POST['password'] ?? '';
    if ($pass === 'admin') {
        $_SESSION['admin_logged_in'] = true;
        echo json_encode(['status' => 'ok', 'message' => 'Login berhasil']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Password salah']);
    }
    exit;
}

if ($action === 'check') {
    echo json_encode([
        'admin' => !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true
    ]);
    exit;
}

if ($action === 'logout') {
    $_SESSION['admin_logged_in'] = false;
    session_unset();
    session_destroy();
    echo json_encode(['status' => 'ok', 'message' => 'Logout berhasil']);
    exit;
}

if ($action === 'upload' && !empty($_SESSION['admin_logged_in'])) {
    if (!isset($_FILES['file'])) {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada file']);
        exit;
    }
    $target = __DIR__ . '/../data/db.json';
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        echo json_encode(['status' => 'ok', 'message' => 'Data berhasil di-upload']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Upload gagal']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid']);
