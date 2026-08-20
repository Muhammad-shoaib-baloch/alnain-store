<?php
// ============================================================
//  Al Nain API configuration
//  1) Copy this file to config.php  (File Manager → Copy/Rename)
//  2) Fill in the three PASTE_ values from StackCP → MySQL Databases
//  3) Visit https://alnain.pk/api/setup.php?key=YOUR_SETUP_KEY once
// ============================================================

define('DB_DRIVER', 'mysql');          // 'mysql' on hosting, 'sqlite' only for local dev
define('DB_HOST',   'localhost');
define('DB_NAME',   'PASTE_DB_NAME');
define('DB_USER',   'PASTE_DB_USER');
define('DB_PASS',   'PASTE_DB_PASSWORD');

// local development only (ignored when DB_DRIVER = mysql)
define('DB_SQLITE_PATH', __DIR__ . '/dev.sqlite');

// one-time installer key — change it to anything private
define('SETUP_KEY', 'alnain-setup-2026');

// origins allowed to call this API from a browser
define('CORS_ORIGINS', [
  'https://alnain.pk',
  'https://www.alnain.pk',
  'http://localhost:5173',
  'http://localhost:4173',
]);
