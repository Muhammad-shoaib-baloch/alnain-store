<?php
// One-time installer: creates tables and loads the seed data.
// Usage: https://alnain.pk/api/setup.php?key=YOUR_SETUP_KEY
// Re-install (wipes data!):  ...setup.php?key=YOUR_SETUP_KEY&force=1
declare(strict_types=1);

require __DIR__ . '/lib.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/seeder.php';

header('Content-Type: text/html; charset=utf-8');

$key = $_GET['key'] ?? '';
if (!hash_equals(SETUP_KEY, (string) $key)) {
  http_response_code(403);
  echo '<h2 style="font-family:sans-serif">403 — wrong or missing setup key.</h2>';
  echo '<p style="font-family:sans-serif">Open this page as: <code>/api/setup.php?key=YOUR_SETUP_KEY</code> (the key is in config.php).</p>';
  exit;
}

$lock = __DIR__ . '/.installed';
if (file_exists($lock) && empty($_GET['force'])) {
  echo '<h2 style="font-family:sans-serif">✅ Already installed.</h2>';
  echo '<p style="font-family:sans-serif">The database is already set up. To wipe everything and re-install the demo data, add <code>&force=1</code> to the URL.</p>';
  exit;
}

try {
  $pdo = pdo();
  create_schema($pdo, DB_DRIVER);
  $counts = import_seed($pdo);
  @file_put_contents($lock, gmdate('c'));
} catch (Throwable $e) {
  http_response_code(500);
  echo '<h2 style="font-family:sans-serif">❌ Setup failed</h2><pre style="color:#b00">' . htmlspecialchars($e->getMessage()) . '</pre>';
  exit;
}

echo '<div style="font-family:sans-serif;max-width:560px;margin:40px auto;line-height:1.6">';
echo '<h2>✅ Al Nain database installed successfully!</h2><ul>';
foreach ($counts as $kind => $n) echo "<li><b>$n</b> $kind(s)</li>";
echo '</ul><p><b>Next:</b> open <a href="https://alnain.pk">alnain.pk</a> — the store now runs on this database.</p>';
echo '<p style="color:#996">Security: sign in as admin and change the admin password (Account → Profile). You can delete this message — setup is locked now.</p></div>';
