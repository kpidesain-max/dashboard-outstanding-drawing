<?php
// Admin gate untuk tombol "Masuk sebagai Admin" di dashboard.
session_start();
header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

if ($action === 'login') {
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    if ($password === 'admin') {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        echo json_encode(array('status' => 'ok', 'message' => 'Login berhasil'));
    } else {
        echo json_encode(array('status' => 'error', 'message' => 'Password salah'));
    }
    exit;
}

if ($action === 'check') {
    echo json_encode(array(
        'admin' => !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true
    ));
    exit;
}

if ($action === 'logout') {
    $_SESSION = array();
    session_destroy();
    echo json_encode(array('status' => 'ok', 'message' => 'Logout berhasil'));
    exit;
}

if ($action === 'upload') {
    if (empty($_SESSION['admin_logged_in'])) {
        http_response_code(401);
        echo json_encode(array('status' => 'error', 'message' => 'Belum login sebagai admin'));
        exit;
    }
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(array('status' => 'error', 'message' => 'File tidak valid'));
        exit;
    }
    $target = dirname(__DIR__) . '/data/db.json';
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)) {
        echo json_encode(array('status' => 'ok', 'message' => 'Data berhasil di-upload'));
    } else {
        http_response_code(500);
        echo json_encode(array('status' => 'error', 'message' => 'Upload gagal'));
    }
    exit;
}

http_response_code(400);
echo json_encode(array('status' => 'error', 'message' => 'Aksi tidak valid'));
