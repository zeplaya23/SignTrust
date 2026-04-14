-- ──────────────────────────────────────────────
-- SignTrust — Database & user initialisation
-- Run against the existing trust-mysql container.
-- ──────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS signtrust_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'signtrust'@'%'
  IDENTIFIED BY 'ChangeMeSignTrustP@ss2024';

GRANT ALL PRIVILEGES ON signtrust_db.* TO 'signtrust'@'%';

FLUSH PRIVILEGES;
