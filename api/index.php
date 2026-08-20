<?php
// ============================================================
//  Al Nain Store API — single-file router
//  All data lives in MySQL; responses use the exact shapes the
//  React frontend consumes. Auth = HMAC bearer tokens.
// ============================================================
declare(strict_types=1);

// local dev via `php -S localhost:8181 -t api api/index.php`
if (php_sapi_name() === 'cli-server') {
  $file = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
  if (is_file($file) && basename($file) !== 'index.php') return false;
}

require __DIR__ . '/lib.php';
cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = trim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = $path === '' ? [] : explode('/', $path);
if (($parts[0] ?? '') === 'api') array_shift($parts);
$p0 = $parts[0] ?? '';
$p1 = $parts[1] ?? '';
$p2 = $parts[2] ?? '';

// ---------------------------------------------------------------- helpers
function is_email(string $e): bool {
  return (bool) filter_var($e, FILTER_VALIDATE_EMAIL);
}

function slugify(string $s): string {
  $s = strtolower(trim($s));
  $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
  return trim($s, '-');
}

function compute_totals(array $settings, int $subtotal, int $discount, string $methodId): array {
  $methods = $settings['shipping']['methods'] ?? [];
  $method = null;
  foreach ($methods as $m) if (($m['id'] ?? '') === $methodId && !empty($m['enabled'])) $method = $m;
  if (!$method) {
    foreach ($methods as $m) if (!empty($m['enabled'])) { $method = $m; $methodId = $m['id']; break; }
  }
  $fee = (int) ($method['fee'] ?? 0);
  $base = max(0, $subtotal - $discount);
  $threshold = (int) ($settings['shipping']['freeShippingThreshold'] ?? 0);
  $free = $methodId === 'standard' && $threshold > 0 && $base >= $threshold;
  $shipping = $subtotal === 0 ? 0 : ($free ? 0 : $fee);
  $tax = !empty($settings['tax']['enabled'])
    ? (int) round($base * ((float) ($settings['tax']['rate'] ?? 0) / 100))
    : 0;
  return ['shipping' => $shipping, 'tax' => $tax, 'total' => $base + $shipping + $tax, 'methodId' => $methodId];
}

function coupon_public(array $c): array {
  return [
    'code' => $c['code'], 'type' => $c['type'], 'value' => $c['value'],
    'minOrder' => $c['minOrder'] ?? 0, 'maxDiscount' => $c['maxDiscount'] ?? null,
    'products' => $c['products'] ?? [], 'categories' => $c['categories'] ?? [],
  ];
}

/** Mirrors the frontend coupon rules. $items: [{productId, category, total}] */
function coupon_check(?array $c, int $subtotal, array $items): array {
  if (!$c) return ['ok' => false, 'reason' => 'This coupon code does not exist.'];
  if (empty($c['active'])) return ['ok' => false, 'reason' => 'This coupon is no longer active.'];
  $nowTs = time();
  if (!empty($c['startsAt']) && strtotime($c['startsAt']) > $nowTs)
    return ['ok' => false, 'reason' => 'This coupon is not active yet.'];
  if (!empty($c['expiresAt']) && strtotime($c['expiresAt']) < $nowTs)
    return ['ok' => false, 'reason' => 'This coupon has expired.'];
  if (isset($c['usageLimit']) && $c['usageLimit'] !== null && ($c['usedCount'] ?? 0) >= $c['usageLimit'])
    return ['ok' => false, 'reason' => 'This coupon has reached its usage limit.'];
  $minOrder = (int) ($c['minOrder'] ?? 0);
  if ($minOrder && $subtotal < $minOrder)
    return ['ok' => false, 'reason' => 'Minimum order for this coupon is Rs. ' . number_format($minOrder) . '.'];

  $base = $subtotal;
  $scopedP = !empty($c['products']);
  $scopedC = !empty($c['categories']);
  if ($scopedP || $scopedC) {
    $base = 0;
    foreach ($items as $it) {
      $byP = $scopedP && in_array($it['productId'], $c['products'], true);
      $byC = $scopedC && in_array($it['category'] ?? '', $c['categories'], true);
      if ($byP || $byC) $base += (int) $it['total'];
    }
    if ($base === 0) return ['ok' => false, 'reason' => 'This coupon does not apply to the items in your cart.'];
  }

  $discount = ($c['type'] ?? 'percentage') === 'percentage'
    ? (int) round($base * ((float) $c['value'] / 100))
    : min((int) $c['value'], $base);
  if (!empty($c['maxDiscount'])) $discount = min($discount, (int) $c['maxDiscount']);
  return ['ok' => true, 'discount' => $discount, 'coupon' => coupon_public($c)];
}

function find_coupon(string $code): ?array {
  $code = strtoupper(trim($code));
  foreach (ents('coupon') as $c) {
    if (strtoupper((string) ($c['code'] ?? '')) === $code) return $c;
  }
  return null;
}

/** Keeps collection.productIds and product.collections in sync (both directions). */
function sync_product_collections(array $product): void {
  $slugs = $product['collections'] ?? [];
  foreach (ents('collection') as $col) {
    $ids = $col['productIds'] ?? [];
    $has = in_array($product['id'], $ids, true);
    $should = in_array($col['slug'], $slugs, true);
    if ($should && !$has) { $ids[] = $product['id']; $col['productIds'] = $ids; ent_put('collection', $col); }
    if (!$should && $has) { $col['productIds'] = array_values(array_diff($ids, [$product['id']])); ent_put('collection', $col); }
  }
}

function unique_slug(string $slug, string $selfId): string {
  foreach (ents('product') as $p) {
    if (($p['slug'] ?? '') === $slug && $p['id'] !== $selfId) {
      return $slug . '-' . random_int(100, 999);
    }
  }
  return $slug;
}

function order_timeline_label(string $status): string {
  return [
    'pending' => 'Order marked pending', 'confirmed' => 'Order confirmed',
    'processing' => 'Being stitched & packed', 'shipped' => 'Handed to courier',
    'delivered' => 'Delivered', 'cancelled' => 'Order cancelled', 'returned' => 'Return processed',
  ][$status] ?? ('Status: ' . $status);
}

function restock_order(array $order): void {
  foreach ($order['items'] as $it) {
    $p = ent_get('product', $it['productId']);
    if (!$p) continue;
    foreach ($p['variants'] as &$v) {
      if ($v['id'] === $it['variantId']) $v['stock'] = (int) $v['stock'] + (int) $it['qty'];
    }
    unset($v);
    ent_put('product', $p);
  }
}

// ---------------------------------------------------------------- routing
try {
  // ---------- health ----------
  if ($p0 === '' && $method === 'GET') {
    respond(['name' => 'Al Nain API', 'ok' => true, 'time' => iso()]);
  }

  // ---------- snapshot ----------
  if ($p0 === 'snapshot' && $method === 'GET') {
    $user = token_user();
    $admin = $user && $user['role'] === 'admin';

    $products = ents('product');
    if (!$admin) $products = array_values(array_filter($products, fn($p) => ($p['status'] ?? '') === 'published'));
    $reviews = ents('review');
    if (!$admin) $reviews = array_values(array_filter($reviews, fn($r) => ($r['status'] ?? '') === 'approved'));

    $out = [
      'live' => true,
      'settings' => public_settings(get_settings()),
      'categories' => ents('category'),
      'collections' => ents('collection'),
      'products' => $products,
      'banners' => ents('banner'),
      'socialLinks' => ents('social'),
      'testimonials' => ents('testimonial'),
      'reviews' => $reviews,
      'coupons' => [],
      'users' => [],
      'orders' => [],
      'messages' => [],
      'newsletter' => [],
    ];
    if ($user) {
      $out['me'] = $user;
      $out['myOrders'] = orders_for($user['id'], $user['email']);
    }
    if ($admin) {
      $out['orders'] = all_orders();
      $out['users'] = all_users();
      $out['coupons'] = ents('coupon');
      $out['messages'] = ents('message');
      $out['newsletter'] = array_column(pdo()->query('SELECT email FROM newsletter ORDER BY created_at DESC')->fetchAll(), 'email');
    }
    respond($out);
  }

  // ---------- auth ----------
  if ($p0 === 'auth' && $p1 === 'login' && $method === 'POST') {
    $b = body();
    $row = user_row_by_email((string) ($b['email'] ?? ''));
    if (!$row || !password_verify((string) ($b['password'] ?? ''), $row['password_hash'])) {
      fail('Invalid email or password.', 401);
    }
    if ($row['status'] !== 'active') fail('This account has been disabled. Contact support.', 403);
    $user = user_from_row($row);
    respond(['token' => make_token($user['id']), 'user' => $user]);
  }

  if ($p0 === 'auth' && $p1 === 'register' && $method === 'POST') {
    $b = body();
    $name = trim((string) ($b['name'] ?? ''));
    $email = strtolower(trim((string) ($b['email'] ?? '')));
    $password = (string) ($b['password'] ?? '');
    if (strlen($name) < 3) fail('Please enter your full name.');
    if (!is_email($email)) fail('Please enter a valid email address.');
    if (strlen($password) < 6) fail('Password must be at least 6 characters.');
    if (user_row_by_email($email)) fail('An account with this email already exists.');
    $user = save_user([
      'id' => uid('u'), 'role' => 'customer', 'name' => $name, 'email' => $email,
      'phone' => trim((string) ($b['phone'] ?? '')), 'status' => 'active',
      'createdAt' => iso(), 'avatar' => null, 'addresses' => [], 'wishlist' => [], 'prefs' => (object) [],
    ], password_hash($password, PASSWORD_DEFAULT));
    respond(['token' => make_token($user['id']), 'user' => $user]);
  }

  if ($p0 === 'auth' && $p1 === 'me' && $method === 'GET') {
    respond(['user' => require_auth()]);
  }

  if ($p0 === 'auth' && $p1 === 'me' && $method === 'PATCH') {
    $user = require_auth();
    $b = body();
    foreach (['name', 'phone', 'avatar', 'addresses', 'wishlist', 'prefs'] as $k) {
      if (array_key_exists($k, $b)) $user[$k] = $b[$k];
    }
    // customers may deactivate (but never elevate) their own account
    if (($b['status'] ?? null) === 'disabled') $user['status'] = 'disabled';
    if (isset($b['email'])) {
      $email = strtolower(trim((string) $b['email']));
      if (!is_email($email)) fail('Please enter a valid email address.');
      $existing = user_row_by_email($email);
      if ($existing && $existing['id'] !== $user['id']) fail('That email is already in use.');
      $user['email'] = $email;
    }
    if (isset($user['name']) && strlen(trim((string) $user['name'])) < 3) fail('Please enter your full name.');
    respond(['user' => save_user($user)]);
  }

  if ($p0 === 'auth' && $p1 === 'password' && $method === 'POST') {
    $user = require_auth();
    $b = body();
    $st = pdo()->prepare('SELECT password_hash FROM users WHERE id = ?');
    $st->execute([$user['id']]);
    $hash = (string) $st->fetchColumn();
    if (!password_verify((string) ($b['current'] ?? ''), $hash)) fail('Current password is incorrect.');
    if (strlen((string) ($b['next'] ?? '')) < 6) fail('New password must be at least 6 characters.');
    save_user($user, password_hash((string) $b['next'], PASSWORD_DEFAULT));
    respond(['ok' => true]);
  }

  // ---------- my orders ----------
  if ($p0 === 'my' && $p1 === 'orders' && $method === 'GET') {
    $user = require_auth();
    respond(['orders' => orders_for($user['id'], $user['email'])]);
  }

  // ---------- checkout ----------
  if ($p0 === 'orders' && $p1 === '' && $method === 'POST') {
    $b = body();
    $cust = $b['customer'] ?? [];
    $first = trim((string) ($cust['firstName'] ?? ''));
    $last = trim((string) ($cust['lastName'] ?? ''));
    $email = strtolower(trim((string) ($cust['email'] ?? '')));
    $phone = trim((string) ($cust['phone'] ?? ''));
    if ($first === '' || $last === '') fail('Please enter your full name.');
    if (!is_email($email)) fail('Please enter a valid email address.');
    if (strlen(preg_replace('/\D/', '', $phone) ?? '') < 10) fail('Please enter a valid phone number.');

    $a = $b['address'] ?? [];
    $address = [
      'name' => $first . ' ' . $last,
      'phone' => $phone,
      'country' => trim((string) ($a['country'] ?? 'Pakistan')),
      'city' => trim((string) ($a['city'] ?? '')),
      'address' => trim((string) ($a['address'] ?? '')),
      'apartment' => trim((string) ($a['apartment'] ?? '')),
      'postalCode' => trim((string) ($a['postalCode'] ?? '')),
    ];
    if ($address['city'] === '') fail('Please select your city.');
    if (strlen($address['address']) < 8) fail('Please enter your complete street address.');

    $items = $b['items'] ?? [];
    if (!is_array($items) || count($items) === 0) fail('Your cart is empty.');

    $settings = get_settings();
    $payment = (string) ($b['paymentMethod'] ?? 'cod');
    $payOk = false;
    foreach (($settings['payments'] ?? []) as $pm) {
      if (($pm['id'] ?? '') === $payment && !empty($pm['enabled'])) $payOk = true;
    }
    if (!$payOk) fail('Selected payment method is not available.');

    $user = token_user();
    $pdo = pdo();
    $pdo->beginTransaction();

    $touched = [];
    $detailed = [];
    foreach ($items as $line) {
      $pid = (string) ($line['productId'] ?? '');
      $vid = (string) ($line['variantId'] ?? '');
      $qty = max(1, min(99, (int) ($line['qty'] ?? 1)));
      $p = $touched[$pid] ?? ent_get('product', $pid);
      if (!$p || ($p['status'] ?? '') !== 'published') { $pdo->rollBack(); fail('A product in your cart is no longer available.'); }
      $variant = null;
      foreach ($p['variants'] as $i => $v) {
        if ($v['id'] === $vid) { $variant = $v; $vIndex = $i; }
      }
      if (!$variant || ($variant['status'] ?? '') !== 'active') { $pdo->rollBack(); fail($p['name'] . ': selected variation is unavailable.'); }
      if (empty($p['allowBackorders']) && (int) $variant['stock'] < $qty) {
        $pdo->rollBack();
        fail($p['name'] . ' (' . implode(' / ', array_values($variant['options'])) . ') has only ' . $variant['stock'] . ' left in stock.', 422);
      }
      $unit = (int) ($variant['salePrice'] ?? $variant['price']);
      $detailed[] = [
        'productId' => $p['id'], 'variantId' => $variant['id'], 'name' => $p['name'], 'slug' => $p['slug'],
        'sku' => $variant['sku'], 'image' => $variant['image'] ?? ($p['images'][0] ?? null),
        'options' => $variant['options'], 'price' => $unit, 'qty' => $qty, 'total' => $unit * $qty,
        'category' => $p['category'],
      ];
      $p['variants'][$vIndex]['stock'] = max(0, (int) $variant['stock'] - $qty);
      $touched[$pid] = $p;
    }

    $subtotal = array_sum(array_column($detailed, 'total'));
    $discount = 0;
    $couponRow = null;
    $code = strtoupper(trim((string) ($b['couponCode'] ?? '')));
    if ($code !== '') {
      $couponRow = find_coupon($code);
      $check = coupon_check($couponRow, $subtotal, $detailed);
      if (!$check['ok']) { $pdo->rollBack(); fail($check['reason'], 422); }
      $discount = $check['discount'];
    }

    $methodId = (string) ($b['shippingMethod'] ?? 'standard');
    $t = compute_totals($settings, $subtotal, $discount, $methodId);

    foreach ($touched as $p) ent_put('product', $p);
    if ($couponRow) {
      $couponRow['usedCount'] = (int) ($couponRow['usedCount'] ?? 0) + 1;
      ent_put('coupon', $couponRow);
    }

    $ins = $pdo->prepare('INSERT INTO orders (number, customer_id, email, status, payment_status, total, data, created_at) VALUES (?,?,?,?,?,?,?,?)');
    $ins->execute(['', $user['id'] ?? null, $email, 'pending', 'pending', $t['total'], '{}', now()]);
    $id = (int) $pdo->lastInsertId();
    $number = 'ALN-' . (1000 + $id);
    $etaDays = $t['methodId'] === 'express' ? 2 : 5;

    $order = [
      'id' => (string) $id, 'number' => $number,
      'customerId' => $user['id'] ?? null,
      'customerName' => $first . ' ' . $last, 'email' => $email, 'phone' => $phone,
      'items' => $detailed, 'subtotal' => $subtotal, 'discount' => $discount,
      'couponCode' => $couponRow['code'] ?? null,
      'shippingMethod' => $t['methodId'], 'shipping' => $t['shipping'], 'tax' => $t['tax'], 'total' => $t['total'],
      'paymentMethod' => $payment, 'paymentStatus' => 'pending', 'status' => 'pending',
      'shippingAddress' => $address, 'trackingNumber' => null, 'notes' => [],
      'timeline' => [['label' => 'Order placed', 'at' => iso()]],
      'createdAt' => iso(),
      'estimatedDelivery' => str_replace(' ', 'T', gmdate('Y-m-d H:i:s', time() + $etaDays * 86400)) . 'Z',
    ];

    $upd = $pdo->prepare('UPDATE orders SET number = ?, data = ? WHERE id = ?');
    $upd->execute([$number, json_encode($order, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $id]);
    $pdo->commit();
    respond(['order' => $order], 201);
  }

  // ---------- order lookup / cancel ----------
  if ($p0 === 'orders' && $p1 !== '' && $p2 === '' && $method === 'GET') {
    $order = order_by_id($p1);
    if (!$order) fail('Order not found.', 404);
    $user = token_user();
    $owner = $user && (($order['customerId'] ?? null) === $user['id'] || $order['email'] === $user['email'] || $user['role'] === 'admin');
    $emailOk = strtolower(trim((string) ($_GET['email'] ?? ''))) === $order['email'];
    if (!$owner && !$emailOk) fail('Order not found.', 404);
    respond(['order' => $order]);
  }

  if ($p0 === 'orders' && $p1 !== '' && $p2 === 'cancel' && $method === 'POST') {
    $user = require_auth();
    $order = order_by_id($p1);
    if (!$order) fail('Order not found.', 404);
    $owner = ($order['customerId'] ?? null) === $user['id'] || $order['email'] === $user['email'] || $user['role'] === 'admin';
    if (!$owner) fail('Order not found.', 404);
    if (!in_array($order['status'], ['pending', 'confirmed'], true)) fail('This order can no longer be cancelled.');
    restock_order($order);
    $order['status'] = 'cancelled';
    $order['timeline'][] = ['label' => 'Cancelled by customer', 'at' => iso()];
    update_order_row($order);
    respond(['order' => $order]);
  }

  // ---------- coupons / reviews / messages / newsletter ----------
  if ($p0 === 'coupons' && $p1 === 'validate' && $method === 'POST') {
    $b = body();
    $result = coupon_check(
      find_coupon((string) ($b['code'] ?? '')),
      (int) ($b['subtotal'] ?? 0),
      is_array($b['items'] ?? null) ? $b['items'] : []
    );
    respond($result);
  }

  if ($p0 === 'reviews' && $method === 'POST') {
    $user = require_auth();
    $b = body();
    $rating = (int) ($b['rating'] ?? 0);
    $text = trim((string) ($b['text'] ?? ''));
    $productId = (string) ($b['productId'] ?? '');
    if ($rating < 1 || $rating > 5) fail('Please choose a rating.');
    if (strlen($text) < 4) fail('Please write a few words about the product.');
    if (!ent_get('product', $productId)) fail('Product not found.', 404);
    $review = ent_put('review', [
      'id' => uid('r'), 'productId' => $productId, 'customerId' => $user['id'],
      'customerName' => $user['name'], 'rating' => $rating,
      'title' => trim((string) ($b['title'] ?? '')), 'text' => $text,
      'status' => 'pending', 'createdAt' => iso(),
    ]);
    respond(['review' => $review], 201);
  }

  if ($p0 === 'messages' && $p1 === '' && $method === 'POST') {
    $b = body();
    $name = trim((string) ($b['name'] ?? ''));
    $email = trim((string) ($b['email'] ?? ''));
    $message = trim((string) ($b['message'] ?? ''));
    if (strlen($name) < 2 || strlen($message) < 5) fail('Please fill in your name and message.');
    if (!is_email($email)) fail('Please enter a valid email address.');
    $msg = ent_put('message', [
      'id' => uid('msg'), 'name' => $name, 'email' => $email, 'message' => $message,
      'status' => 'new', 'createdAt' => iso(),
    ]);
    respond(['message' => $msg], 201);
  }

  if ($p0 === 'newsletter' && $method === 'POST') {
    $email = strtolower(trim((string) (body()['email'] ?? '')));
    if (!is_email($email)) fail('Please enter a valid email address.');
    $st = pdo()->prepare('SELECT email FROM newsletter WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) fail('You are already subscribed.');
    pdo()->prepare('INSERT INTO newsletter (email, created_at) VALUES (?, ?)')->execute([$email, now()]);
    respond(['ok' => true], 201);
  }

  // ================= ADMIN =================
  if ($p0 === 'admin') {
    $adminUser = require_admin();

    // ----- products -----
    if ($p1 === 'products' && $p2 === '' && $method === 'POST') {
      $b = body();
      if (strlen(trim((string) ($b['name'] ?? ''))) < 3) fail('Product name is required.');
      if (trim((string) ($b['sku'] ?? '')) === '') fail('SKU is required.');
      if ((float) ($b['price'] ?? 0) <= 0) fail('Enter a valid price.');
      if (trim((string) ($b['category'] ?? '')) === '') fail('Select a category.');
      $isNewRecord = empty($b['id']);
      if ($isNewRecord) {
        $b['id'] = uid('p');
        $b['createdAt'] = iso();
        $b += ['rating' => 0, 'reviewCount' => 0, 'collections' => [], 'tags' => [], 'images' => [],
               'attributes' => [], 'variants' => [], 'details' => [], 'lowStockThreshold' => 5,
               'allowBackorders' => false, 'seo' => (object) [], 'status' => 'draft'];
      }
      $b['slug'] = unique_slug(slugify((string) ($b['slug'] ?? $b['name'])), $b['id']);
      $b['updatedAt'] = iso();
      $product = ent_put('product', $b);
      sync_product_collections($product);
      respond(['product' => $product], $isNewRecord ? 201 : 200);
    }

    if ($p1 === 'products' && $p2 !== '' && ($parts[3] ?? '') === 'duplicate' && $method === 'POST') {
      $src = ent_get('product', $p2);
      if (!$src) fail('Product not found.', 404);
      $copy = $src;
      $copy['id'] = uid('p');
      $copy['name'] = $src['name'] . ' (Copy)';
      $copy['slug'] = unique_slug($src['slug'] . '-copy-' . random_int(100, 999), $copy['id']);
      $copy['sku'] = $src['sku'] . '-C';
      $copy['status'] = 'draft';
      $copy['createdAt'] = iso();
      $copy['updatedAt'] = iso();
      respond(['product' => ent_put('product', $copy)], 201);
    }

    if ($p1 === 'products' && $p2 !== '' && $method === 'DELETE') {
      $product = ent_get('product', $p2);
      if ($product) {
        $product['collections'] = [];
        sync_product_collections($product);
        ent_del('product', $p2);
      }
      respond(['ok' => true]);
    }

    if ($p1 === 'inventory' && $method === 'PATCH') {
      $b = body();
      $p = ent_get('product', (string) ($b['productId'] ?? ''));
      if (!$p) fail('Product not found.', 404);
      foreach ($p['variants'] as &$v) {
        if ($v['id'] === ($b['variantId'] ?? '')) $v['stock'] = max(0, (int) ($b['stock'] ?? 0));
      }
      unset($v);
      $p['updatedAt'] = iso();
      respond(['product' => ent_put('product', $p)]);
    }

    // ----- categories -----
    if ($p1 === 'categories' && $p2 === '' && $method === 'POST') {
      $b = body();
      if (strlen(trim((string) ($b['name'] ?? ''))) < 2) fail('Category name is required.');
      if (empty($b['id'])) $b['id'] = uid('c');
      $b['slug'] = slugify((string) ($b['slug'] ?? $b['name']));
      $b['parentId'] = $b['parentId'] ?? null;
      $b['status'] = $b['status'] ?? 'active';
      respond(['category' => ent_put('category', $b)]);
    }

    if ($p1 === 'categories' && $p2 !== '' && $method === 'DELETE') {
      $cat = ent_get('category', $p2);
      if ($cat) {
        $parent = $cat['parentId'] ? ent_get('category', (string) $cat['parentId']) : null;
        foreach (ents('product') as $p) {
          if (($p['category'] ?? '') === $cat['slug']) {
            $p['category'] = $parent['slug'] ?? '';
            ent_put('product', $p);
          }
        }
        foreach (ents('category') as $c) {
          if (($c['parentId'] ?? null) === $cat['id']) {
            $c['parentId'] = $cat['parentId'] ?? null;
            ent_put('category', $c);
          }
        }
        ent_del('category', $p2);
      }
      respond(['ok' => true]);
    }

    // ----- collections -----
    if ($p1 === 'collections' && $p2 === '' && $method === 'POST') {
      $b = body();
      if (strlen(trim((string) ($b['name'] ?? ''))) < 2) fail('Collection name is required.');
      if (empty($b['id'])) $b['id'] = uid('col');
      $b['slug'] = slugify((string) ($b['slug'] ?? $b['name']));
      $b['productIds'] = array_values(array_unique($b['productIds'] ?? []));
      $col = ent_put('collection', $b);
      foreach (ents('product') as $p) {
        $has = in_array($col['slug'], $p['collections'] ?? [], true);
        $should = in_array($p['id'], $col['productIds'], true);
        if ($should && !$has) { $p['collections'][] = $col['slug']; ent_put('product', $p); }
        if (!$should && $has) { $p['collections'] = array_values(array_diff($p['collections'], [$col['slug']])); ent_put('product', $p); }
      }
      respond(['collection' => $col]);
    }

    if ($p1 === 'collections' && $p2 !== '' && $method === 'DELETE') {
      $col = ent_get('collection', $p2);
      if ($col) {
        foreach (ents('product') as $p) {
          if (in_array($col['slug'], $p['collections'] ?? [], true)) {
            $p['collections'] = array_values(array_diff($p['collections'], [$col['slug']]));
            ent_put('product', $p);
          }
        }
        ent_del('collection', $p2);
      }
      respond(['ok' => true]);
    }

    // ----- orders -----
    if ($p1 === 'orders' && $p2 !== '' && $method === 'PATCH') {
      $order = order_by_id($p2);
      if (!$order) fail('Order not found.', 404);
      $b = body();

      if (!empty($b['cancel'])) {
        if ($order['status'] !== 'cancelled') {
          restock_order($order);
          $order['status'] = 'cancelled';
          $order['timeline'][] = ['label' => 'Cancelled by store', 'at' => iso()];
        }
      } else {
        if (isset($b['status']) && $b['status'] !== $order['status']) {
          $order['status'] = (string) $b['status'];
          $order['timeline'][] = ['label' => (string) ($b['timelineLabel'] ?? order_timeline_label($order['status'])), 'at' => iso()];
        }
        if (isset($b['paymentStatus']) && $b['paymentStatus'] !== $order['paymentStatus']) {
          $order['paymentStatus'] = (string) $b['paymentStatus'];
          $order['timeline'][] = ['label' => 'Payment marked ' . $order['paymentStatus'], 'at' => iso()];
        }
        if (array_key_exists('trackingNumber', $b)) {
          $tn = trim((string) ($b['trackingNumber'] ?? ''));
          $order['trackingNumber'] = $tn === '' ? null : $tn;
          if ($tn !== '') $order['timeline'][] = ['label' => 'Tracking number added (' . $tn . ')', 'at' => iso()];
        }
        if (!empty($b['note'])) {
          $order['notes'][] = ['id' => uid('n'), 'text' => trim((string) $b['note']), 'by' => $adminUser['name'], 'at' => iso()];
        }
      }
      update_order_row($order);
      respond(['order' => $order]);
    }

    // ----- customers -----
    if ($p1 === 'customers' && $p2 !== '' && $method === 'PATCH') {
      $target = user_by_id($p2);
      if (!$target) fail('Customer not found.', 404);
      $b = body();
      foreach (['name', 'phone', 'status'] as $k) {
        if (isset($b[$k])) $target[$k] = $b[$k];
      }
      if (isset($b['email'])) {
        $email = strtolower(trim((string) $b['email']));
        if (!is_email($email)) fail('Please enter a valid email address.');
        $existing = user_row_by_email($email);
        if ($existing && $existing['id'] !== $target['id']) fail('That email is already in use.');
        $target['email'] = $email;
      }
      respond(['user' => save_user($target)]);
    }

    // ----- coupons -----
    if ($p1 === 'coupons' && $p2 === '' && $method === 'POST') {
      $b = body();
      $code = strtoupper(trim((string) ($b['code'] ?? '')));
      if ($code === '') fail('Coupon code is required.');
      foreach (ents('coupon') as $c) {
        if (strtoupper($c['code']) === $code && $c['id'] !== ($b['id'] ?? null)) {
          fail('Coupon code "' . $code . '" already exists.');
        }
      }
      if (empty($b['id'])) { $b['id'] = uid('cp'); $b['usedCount'] = 0; }
      $b['code'] = $code;
      respond(['coupon' => ent_put('coupon', $b)]);
    }
    if ($p1 === 'coupons' && $p2 !== '' && $method === 'DELETE') {
      ent_del('coupon', $p2);
      respond(['ok' => true]);
    }

    // ----- reviews -----
    if ($p1 === 'reviews' && $p2 !== '' && $method === 'PATCH') {
      $r = ent_get('review', $p2);
      if (!$r) fail('Review not found.', 404);
      $r['status'] = (string) (body()['status'] ?? $r['status']);
      respond(['review' => ent_put('review', $r)]);
    }
    if ($p1 === 'reviews' && $p2 !== '' && $method === 'DELETE') {
      ent_del('review', $p2);
      respond(['ok' => true]);
    }

    // ----- banners -----
    if ($p1 === 'banners' && $p2 === '' && $method === 'POST') {
      $b = body();
      if (strlen(trim((string) ($b['heading'] ?? ''))) < 2) fail('Banner heading is required.');
      if (empty($b['id'])) $b['id'] = uid('bn');
      $b['position'] = (int) ($b['position'] ?? 1);
      respond(['banner' => ent_put('banner', $b)]);
    }
    if ($p1 === 'banners' && $p2 !== '' && $method === 'DELETE') {
      ent_del('banner', $p2);
      respond(['ok' => true]);
    }

    // ----- social links (full list replace) -----
    if ($p1 === 'social' && $method === 'PUT') {
      $links = body()['links'] ?? [];
      if (!is_array($links)) fail('Invalid payload.');
      pdo()->prepare("DELETE FROM entities WHERE kind = 'social'")->execute();
      $saved = [];
      foreach ($links as $i => $link) {
        if (empty($link['id'])) $link['id'] = uid('sl');
        $link['order'] = (int) ($link['order'] ?? ($i + 1));
        $saved[] = ent_put('social', $link);
      }
      respond(['socialLinks' => $saved]);
    }

    // ----- settings -----
    if ($p1 === 'settings' && $method === 'PUT') {
      $patch = body();
      $settings = get_settings();
      foreach ($patch as $k => $v) {
        if (str_starts_with((string) $k, '__')) continue;
        if (is_array($v) && !array_is_list($v) && isset($settings[$k]) && is_array($settings[$k])) {
          $settings[$k] = array_merge($settings[$k], $v);
        } else {
          $settings[$k] = $v;
        }
      }
      save_settings($settings);
      respond(['settings' => public_settings($settings)]);
    }

    // ----- messages -----
    if ($p1 === 'messages' && $p2 !== '' && $method === 'PATCH') {
      $m = ent_get('message', $p2);
      if (!$m) fail('Message not found.', 404);
      $m['status'] = (string) (body()['status'] ?? $m['status']);
      respond(['message' => ent_put('message', $m)]);
    }
    if ($p1 === 'messages' && $p2 !== '' && $method === 'DELETE') {
      ent_del('message', $p2);
      respond(['ok' => true]);
    }

    // ----- image upload (data URL → file) -----
    if ($p1 === 'upload' && $method === 'POST') {
      $dataUrl = (string) (body()['dataUrl'] ?? '');
      if (!preg_match('#^data:image/(png|jpe?g|webp|gif);base64,(.+)$#s', $dataUrl, $m)) {
        fail('Only PNG, JPG, WEBP or GIF images are allowed.');
      }
      $bytes = base64_decode($m[2], true);
      if ($bytes === false || strlen($bytes) > 3 * 1024 * 1024) fail('Image must be under 3 MB.');
      $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
      $dir = __DIR__ . '/uploads';
      if (!is_dir($dir)) mkdir($dir, 0755, true);
      $name = 'img_' . bin2hex(random_bytes(8)) . '.' . $ext;
      file_put_contents($dir . '/' . $name, $bytes);
      respond(['url' => '/api/uploads/' . $name], 201);
    }

    // ----- reset demo data -----
    if ($p1 === 'reset' && $method === 'POST') {
      require_once __DIR__ . '/schema.php';
      require_once __DIR__ . '/seeder.php';
      create_schema(pdo(), DB_DRIVER);
      $counts = import_seed(pdo());
      respond(['ok' => true, 'counts' => $counts]);
    }
  }

  fail('Not found.', 404);
} catch (Throwable $e) {
  error_log('[alnain-api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
  fail('Server error. Please try again.', 500);
}
