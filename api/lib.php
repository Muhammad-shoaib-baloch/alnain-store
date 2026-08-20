<?php
// Core helpers for the Al Nain API: DB, JSON responses, auth tokens, entities.
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

if (!file_exists(__DIR__ . '/config.php')) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'API not configured. Copy config.sample.php to config.php and fill in the database details.']);
  exit;
}
require __DIR__ . '/config.php';

// ---------------------------------------------------------------- responses
function respond($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  // API data must never be cached by browsers or the hosting CDN
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
  header('Expires: 0');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function fail(string $msg, int $code = 400): void {
  respond(['error' => $msg], $code);
}

function body(): array {
  $raw = file_get_contents('php://input');
  $d = json_decode($raw !== false && $raw !== '' ? $raw : '{}', true);
  return is_array($d) ? $d : [];
}

function cors(): void {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origin && in_array($origin, CORS_ORIGINS, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 86400');
  }
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

// ---------------------------------------------------------------- database
function pdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  try {
    if (DB_DRIVER === 'sqlite') {
      $pdo = new PDO('sqlite:' . DB_SQLITE_PATH);
      $pdo->exec('PRAGMA journal_mode=WAL');
    } else {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"]
      );
    }
  } catch (Throwable $e) {
    respond(['error' => 'Database connection failed. Check config.php credentials.'], 500);
  }
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  return $pdo;
}

function now(): string {
  return gmdate('Y-m-d H:i:s');
}

function iso(?string $dbTime = null): string {
  return str_replace(' ', 'T', $dbTime ?? now()) . 'Z';
}

function uid(string $prefix = ''): string {
  return ($prefix ? $prefix . '-' : '') . base_convert((string) time(), 10, 36) . bin2hex(random_bytes(3));
}

// ---------------------------------------------------------------- settings
function get_settings(): array {
  $row = pdo()->query('SELECT data FROM settings WHERE id = 1')->fetch();
  return $row ? (json_decode($row['data'], true) ?: []) : [];
}

function save_settings(array $settings): void {
  $st = pdo()->prepare('UPDATE settings SET data = ? WHERE id = 1');
  $st->execute([json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

function public_settings(array $s): array {
  foreach (array_keys($s) as $k) {
    if (str_starts_with((string) $k, '__')) unset($s[$k]);
  }
  return $s;
}

function app_secret(): string {
  $s = get_settings();
  return (string) ($s['__secret'] ?? SETUP_KEY);
}

// ---------------------------------------------------------------- auth
function b64u(string $s): string {
  return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64u_decode(string $s): string {
  return (string) base64_decode(strtr($s, '-_', '+/'));
}

function make_token(string $userId): string {
  $payload = b64u(json_encode(['u' => $userId, 'x' => time() + 60 * 60 * 24 * 30]));
  return $payload . '.' . b64u(hash_hmac('sha256', $payload, app_secret(), true));
}

function token_user(): ?array {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(\S+)/i', $header, $m)) return null;
  $parts = explode('.', $m[1]);
  if (count($parts) !== 2) return null;
  [$payload, $sig] = $parts;
  if (!hash_equals(b64u(hash_hmac('sha256', $payload, app_secret(), true)), $sig)) return null;
  $data = json_decode(b64u_decode($payload), true);
  if (!is_array($data) || ($data['x'] ?? 0) < time()) return null;
  $user = user_by_id((string) ($data['u'] ?? ''));
  if (!$user || $user['status'] !== 'active') return null;
  return $user;
}

function require_auth(): array {
  $u = token_user();
  if (!$u) fail('Please sign in first.', 401);
  return $u;
}

function require_admin(): array {
  $u = require_auth();
  if (($u['role'] ?? '') !== 'admin') fail('Not authorized.', 403);
  return $u;
}

// ---------------------------------------------------------------- users
function user_from_row(array $row): array {
  $data = json_decode($row['data'], true) ?: [];
  return array_merge($data, [
    'id' => $row['id'],
    'email' => $row['email'],
    'role' => $row['role'],
    'status' => $row['status'],
    'createdAt' => $data['createdAt'] ?? iso($row['created_at']),
  ]);
}

function user_by_id(string $id): ?array {
  $st = pdo()->prepare('SELECT * FROM users WHERE id = ?');
  $st->execute([$id]);
  $row = $st->fetch();
  return $row ? user_from_row($row) : null;
}

function user_row_by_email(string $email): ?array {
  $st = pdo()->prepare('SELECT * FROM users WHERE email = ?');
  $st->execute([strtolower(trim($email))]);
  $row = $st->fetch();
  return $row ?: null;
}

function all_users(): array {
  $rows = pdo()->query('SELECT * FROM users ORDER BY created_at DESC')->fetchAll();
  return array_map('user_from_row', $rows);
}

/** Insert or update a user. $user is the frontend-shaped object (no password). */
function save_user(array $user, ?string $passwordHash = null): array {
  $id = $user['id'] ?? uid('u');
  $user['id'] = $id;
  $email = strtolower(trim((string) ($user['email'] ?? '')));
  $data = $user;
  unset($data['password']);
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

  $exists = pdo()->prepare('SELECT id FROM users WHERE id = ?');
  $exists->execute([$id]);
  if ($exists->fetch()) {
    if ($passwordHash !== null) {
      $st = pdo()->prepare('UPDATE users SET email=?, role=?, status=?, data=?, password_hash=? WHERE id=?');
      $st->execute([$email, $user['role'] ?? 'customer', $user['status'] ?? 'active', $json, $passwordHash, $id]);
    } else {
      $st = pdo()->prepare('UPDATE users SET email=?, role=?, status=?, data=? WHERE id=?');
      $st->execute([$email, $user['role'] ?? 'customer', $user['status'] ?? 'active', $json, $id]);
    }
  } else {
    $st = pdo()->prepare('INSERT INTO users (id, email, password_hash, role, status, data, created_at) VALUES (?,?,?,?,?,?,?)');
    $st->execute([$id, $email, $passwordHash ?? '', $user['role'] ?? 'customer', $user['status'] ?? 'active', $json, now()]);
  }
  return user_by_id($id);
}

// ---------------------------------------------------------------- entities
// Generic JSON documents: product, category, collection, coupon, banner,
// social, testimonial, review, message.
function ents(string $kind): array {
  $st = pdo()->prepare('SELECT data FROM entities WHERE kind = ? ORDER BY created_at ASC');
  $st->execute([$kind]);
  $out = [];
  foreach ($st->fetchAll() as $row) {
    $d = json_decode($row['data'], true);
    if (is_array($d)) $out[] = $d;
  }
  return $out;
}

function ent_get(string $kind, string $id): ?array {
  $st = pdo()->prepare('SELECT data FROM entities WHERE kind = ? AND id = ?');
  $st->execute([$kind, $id]);
  $row = $st->fetch();
  return $row ? (json_decode($row['data'], true) ?: null) : null;
}

function ent_put(string $kind, array $obj): array {
  $id = (string) ($obj['id'] ?? '');
  if ($id === '') {
    $id = uid(substr($kind, 0, 3));
    $obj['id'] = $id;
  }
  $json = json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $st = pdo()->prepare('UPDATE entities SET data = ?, updated_at = ? WHERE kind = ? AND id = ?');
  $st->execute([$json, now(), $kind, $id]);
  if ($st->rowCount() === 0) {
    $ins = pdo()->prepare('INSERT INTO entities (kind, id, data, created_at, updated_at) VALUES (?,?,?,?,?)');
    try {
      $ins->execute([$kind, $id, $json, now(), now()]);
    } catch (Throwable $e) {
      // raced with an identical update — retry the update
      $st->execute([$json, now(), $kind, $id]);
    }
  }
  return $obj;
}

function ent_del(string $kind, string $id): void {
  $st = pdo()->prepare('DELETE FROM entities WHERE kind = ? AND id = ?');
  $st->execute([$kind, $id]);
}

// ---------------------------------------------------------------- orders
function order_from_row(array $row): array {
  $d = json_decode($row['data'], true) ?: [];
  $d['id'] = (string) $row['id'];
  return $d;
}

function all_orders(): array {
  $rows = pdo()->query('SELECT * FROM orders ORDER BY id DESC')->fetchAll();
  return array_map('order_from_row', $rows);
}

function order_by_id(string $id): ?array {
  $st = pdo()->prepare('SELECT * FROM orders WHERE id = ? OR number = ?');
  $st->execute([$id, $id]);
  $row = $st->fetch();
  return $row ? order_from_row($row) : null;
}

function orders_for(string $customerId, string $email): array {
  $st = pdo()->prepare('SELECT * FROM orders WHERE customer_id = ? OR email = ? ORDER BY id DESC');
  $st->execute([$customerId, strtolower($email)]);
  return array_map('order_from_row', $st->fetchAll());
}

function update_order_row(array $order): void {
  $st = pdo()->prepare('UPDATE orders SET status=?, payment_status=?, data=? WHERE id=?');
  $st->execute([
    $order['status'],
    $order['paymentStatus'],
    json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    (int) $order['id'],
  ]);
}
