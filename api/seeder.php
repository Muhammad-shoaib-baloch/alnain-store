<?php
// Imports api/seed.json into the database.
// Modes:
//   'full'    — wipe everything and reinstall (existing user PASSWORDS are preserved
//               for emails that also exist in the seed, so admin keeps their password)
//   'catalog' — replace ONLY products/categories/collections/banners; users, orders,
//               reviews, messages, coupons, settings and newsletter stay untouched
declare(strict_types=1);

function seed_data(): array {
  $seedFile = __DIR__ . '/seed.json';
  if (!file_exists($seedFile)) throw new RuntimeException('seed.json not found');
  $seed = json_decode((string) file_get_contents($seedFile), true);
  if (!is_array($seed)) throw new RuntimeException('seed.json is not valid JSON');
  return $seed;
}

function seed_insert_kinds(PDO $pdo, array $seed, array $kindMap): array {
  $toDb = fn($iso) => $iso ? gmdate('Y-m-d H:i:s', strtotime((string) $iso) ?: time()) : now();
  $eSt = $pdo->prepare('INSERT INTO entities (kind, id, data, created_at, updated_at) VALUES (?,?,?,?,?)');
  $counts = [];
  foreach ($kindMap as $kind => $key) {
    $i = 0;
    foreach (($seed[$key] ?? []) as $obj) {
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
  return $counts;
}

const CATALOG_KINDS = ['product' => 'products', 'category' => 'categories', 'collection' => 'collections', 'banner' => 'banners'];
const OTHER_KINDS = ['coupon' => 'coupons', 'social' => 'socialLinks', 'testimonial' => 'testimonials', 'review' => 'reviews', 'message' => 'messages'];

/** Catalogue-only update: products/categories/collections/banners replaced, everything else preserved. */
function import_catalog(PDO $pdo): array {
  $seed = seed_data();
  $pdo->beginTransaction();
  try {
    $del = $pdo->prepare('DELETE FROM entities WHERE kind = ?');
    foreach (array_keys(CATALOG_KINDS) as $kind) $del->execute([$kind]);
    $counts = seed_insert_kinds($pdo, $seed, CATALOG_KINDS);
    $pdo->commit();
    return $counts;
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }
}

/** Full reinstall. Passwords of users whose email exists in both old DB and seed survive. */
function import_seed(PDO $pdo): array {
  $seed = seed_data();
  $toDb = fn($iso) => $iso ? gmdate('Y-m-d H:i:s', strtotime((string) $iso) ?: time()) : now();

  // remember current password hashes (so a changed admin password survives reinstall)
  $existingHashes = [];
  try {
    foreach ($pdo->query('SELECT email, password_hash FROM users') as $row) {
      if (!empty($row['password_hash'])) $existingHashes[strtolower($row['email'])] = $row['password_hash'];
    }
  } catch (Throwable $e) {
    // first install — table may not exist yet
  }

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

    // users — seed passwords hashed; previously-set passwords win
    $uSt = $pdo->prepare('INSERT INTO users (id, email, password_hash, role, status, data, created_at) VALUES (?,?,?,?,?,?,?)');
    foreach (($seed['users'] ?? []) as $u) {
      $email = strtolower($u['email']);
      $hash = $existingHashes[$email] ?? password_hash((string) ($u['password'] ?? bin2hex(random_bytes(8))), PASSWORD_DEFAULT);
      $data = $u;
      unset($data['password']);
      $uSt->execute([
        $u['id'], $email, $hash, $u['role'] ?? 'customer', $u['status'] ?? 'active',
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $toDb($u['createdAt'] ?? null),
      ]);
    }

    $counts = seed_insert_kinds($pdo, $seed, array_merge(CATALOG_KINDS, OTHER_KINDS));

    // orders — auto-increment ids line up with seed numbers
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
    if ($existingHashes) $counts['passwords preserved'] = count(array_intersect_key($existingHashes, array_flip(array_map(fn($u) => strtolower($u['email']), $seed['users'] ?? []))));

    $pdo->commit();
    return $counts;
  } catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
  }
}
