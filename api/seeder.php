<?php
// Imports api/seed.json into the database (used by setup.php and admin reset).
declare(strict_types=1);

function import_seed(PDO $pdo): array {
  $seedFile = __DIR__ . '/seed.json';
  if (!file_exists($seedFile)) throw new RuntimeException('seed.json not found');
  $seed = json_decode((string) file_get_contents($seedFile), true);
  if (!is_array($seed)) throw new RuntimeException('seed.json is not valid JSON');

  $toDb = fn($iso) => $iso ? gmdate('Y-m-d H:i:s', strtotime((string) $iso) ?: time()) : now();

  $pdo->beginTransaction();
  try {
    foreach (['entities', 'users', 'orders', 'newsletter', 'settings'] as $t) {
      $pdo->exec("DELETE FROM $t");
    }

    // settings (+ private signing secret, kept out of API responses)
    $settings = $seed['settings'] ?? [];
    $settings['__secret'] = bin2hex(random_bytes(24));
    $pdo->prepare('INSERT INTO settings (id, data) VALUES (1, ?)')
        ->execute([json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);

    // users — demo passwords get properly hashed
    $uSt = $pdo->prepare('INSERT INTO users (id, email, password_hash, role, status, data, created_at) VALUES (?,?,?,?,?,?,?)');
    foreach (($seed['users'] ?? []) as $u) {
      $hash = password_hash((string) ($u['password'] ?? bin2hex(random_bytes(8))), PASSWORD_DEFAULT);
      $data = $u;
      unset($data['password']);
      $uSt->execute([
        $u['id'], strtolower($u['email']), $hash, $u['role'] ?? 'customer', $u['status'] ?? 'active',
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $toDb($u['createdAt'] ?? null),
      ]);
    }

    // generic entities
    $kinds = [
      'product' => 'products', 'category' => 'categories', 'collection' => 'collections',
      'coupon' => 'coupons', 'banner' => 'banners', 'social' => 'socialLinks',
      'testimonial' => 'testimonials', 'review' => 'reviews', 'message' => 'messages',
    ];
    $eSt = $pdo->prepare('INSERT INTO entities (kind, id, data, created_at, updated_at) VALUES (?,?,?,?,?)');
    $counts = [];
    foreach ($kinds as $kind => $key) {
      $i = 0;
      foreach (($seed[$key] ?? []) as $obj) {
        // keep original list order stable via created_at seconds offset
        $created = isset($obj['createdAt']) ? $toDb($obj['createdAt']) : gmdate('Y-m-d H:i:s', time() - 100000 + $i);
        $eSt->execute([
          $kind, (string) $obj['id'],
          json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
          $created, now(),
        ]);
        $i++;
      }
      $counts[$kind] = $i;
    }

    // orders — auto-increment ids line up with seed numbers (ALN-1001 → id 1)
    $oSt = $pdo->prepare('INSERT INTO orders (number, customer_id, email, status, payment_status, total, data, created_at) VALUES (?,?,?,?,?,?,?,?)');
    $orders = $seed['orders'] ?? [];
    usort($orders, fn($a, $b) => strcmp($a['number'], $b['number']));
    $n = 0;
    foreach ($orders as $o) {
      $oSt->execute([
        $o['number'], $o['customerId'] ?? null, strtolower((string) ($o['email'] ?? '')),
        $o['status'], $o['paymentStatus'], (int) $o['total'], '{}', $toDb($o['createdAt'] ?? null),
      ]);
      $newId = (string) $pdo->lastInsertId();
      $o['id'] = $newId;
      $pdo->prepare('UPDATE orders SET data = ? WHERE id = ?')
          ->execute([json_encode($o, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), (int) $newId]);
      $n++;
    }
    $counts['order'] = $n;
    $counts['user'] = count($seed['users'] ?? []);

    $pdo->commit();
    return $counts;
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }
}
