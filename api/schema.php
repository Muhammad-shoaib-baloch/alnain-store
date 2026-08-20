<?php
// Creates the database tables (idempotent). Dialect-aware for MySQL / SQLite.
declare(strict_types=1);

function create_schema(PDO $pdo, string $driver): void {
  $isMysql = $driver === 'mysql';
  $textType = $isMysql ? 'LONGTEXT' : 'TEXT';
  $engine = $isMysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
  $autoId = $isMysql ? 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

  $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
    id INT NOT NULL PRIMARY KEY,
    data $textType NOT NULL
  )$engine");

  $pdo->exec("CREATE TABLE IF NOT EXISTS entities (
    kind VARCHAR(32) NOT NULL,
    id VARCHAR(80) NOT NULL,
    data $textType NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (kind, id)
  )$engine");

  $pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(80) NOT NULL PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'customer',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    data $textType NOT NULL,
    created_at DATETIME NOT NULL
  )$engine");

  $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
    id $autoId,
    number VARCHAR(32) NOT NULL DEFAULT '',
    customer_id VARCHAR(80) NULL,
    email VARCHAR(190) NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(24) NOT NULL DEFAULT 'pending',
    total INT NOT NULL DEFAULT 0,
    data $textType NOT NULL,
    created_at DATETIME NOT NULL
  )$engine");

  $pdo->exec("CREATE TABLE IF NOT EXISTS newsletter (
    email VARCHAR(190) NOT NULL PRIMARY KEY,
    created_at DATETIME NOT NULL
  )$engine");
}
