<?php
// Installer / updater.
//   First install:      /api/setup.php?key=YOUR_SETUP_KEY
//   Catalogue update:   /api/setup.php?key=YOUR_SETUP_KEY&mode=catalog
//        → replaces only products/categories/collections/banners;
//          orders, customers, passwords, messages and settings stay safe.
//   Full re-install:    /api/setup.php?key=YOUR_SETUP_KEY&force=1
//        → wipes data, but previously-changed passwords are preserved.
declare(strict_types=1);

require __DIR__ . '/lib.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/seeder.php';

header('Content-Type: text/html; charset=utf-8');
$wrap = fn(string $html) => print('<div style="font-family:sans-serif;max-width:560px;margin:40px auto;line-height:1.6">' . $html . '</div>');

$key = $_GET['key'] ?? '';
if (!hash_equals(SETUP_KEY, (string) $key)) {
  http_response_code(403);
  $wrap('<h2>403 — wrong or missing setup key.</h2><p>Open as: <code>/api/setup.php?key=YOUR_SETUP_KEY</code> (key is in config.php).</p>');
  exit;
}

$mode = ($_GET['mode'] ?? '') === 'catalog' ? 'catalog' : 'full';
$lock = __DIR__ . '/.installed';

try {
  $pdo = pdo();
  create_schema($pdo, DB_DRIVER);

  if ($mode === 'catalog') {
    if (!file_exists($lock)) {
      $wrap('<h2>⚠️ Store is not installed yet.</h2><p>Run the full install first: <code>/api/setup.php?key=…</code></p>');
      exit;
    }
    $counts = import_catalog($pdo);
    $list = '';
    foreach ($counts as $kind => $n) $list .= "<li><b>$n</b> $kind(s)</li>";
    $wrap('<h2>✅ Catalogue updated!</h2><ul>' . $list . '</ul>'
      . '<p>Orders, customers, passwords, messages aur settings — sab mehfooz rahe. ✔</p>'
      . '<p>Open <a href="https://alnain.pk">alnain.pk</a> and hard-refresh (Ctrl+Shift+R).</p>');
    exit;
  }

  if (file_exists($lock) && empty($_GET['force'])) {
    $wrap('<h2>✅ Already installed.</h2>'
      . '<p>Catalogue update (safe): add <code>&mode=catalog</code> to the URL.<br>'
      . 'Full re-install (wipes orders/customers): add <code>&force=1</code> — your changed passwords still survive.</p>');
    exit;
  }

  $counts = import_seed($pdo);
  @file_put_contents($lock, gmdate('c'));
  $list = '';
  foreach ($counts as $kind => $n) $list .= "<li><b>$n</b> $kind(s)</li>";
  $wrap('<h2>✅ Al Nain database installed successfully!</h2><ul>' . $list . '</ul>'
    . '<p><b>Next:</b> open <a href="https://alnain.pk">alnain.pk</a>.</p>'
    . '<p style="color:#996">If this was the FIRST install, sign in as admin and change the admin password. '
    . 'On re-installs your previously-changed password has been preserved automatically.</p>');
} catch (Throwable $e) {
  http_response_code(500);
  $wrap('<h2>❌ Setup failed</h2><pre style="color:#b00">' . htmlspecialchars($e->getMessage()) . '</pre>');
}
