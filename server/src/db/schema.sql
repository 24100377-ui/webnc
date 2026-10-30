-- Finora · schema MySQL 8
-- Charset utf8mb4, tiền lưu BIGINT (VND không có phần lẻ)

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(500) NULL,
  currency        ENUM('VND','USD') NOT NULL DEFAULT 'VND',
  locale          ENUM('vi','en') NOT NULL DEFAULT 'vi',
  theme           ENUM('light','dark','system') NOT NULL DEFAULT 'light',
  month_start_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
  notify_budget   TINYINT(1) NOT NULL DEFAULT 1,
  notify_report   TINYINT(1) NOT NULL DEFAULT 1,
  notify_tips     TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  type         ENUM('bank','credit','ewallet','cash','investment') NOT NULL DEFAULT 'bank',
  balance      BIGINT NOT NULL DEFAULT 0,
  credit_limit BIGINT NULL,
  last4        CHAR(4) NULL,
  icon         VARCHAR(50) NULL,
  color        VARCHAR(20) NULL,
  is_archived  TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_accounts_user (user_id),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id   BIGINT UNSIGNED NOT NULL,
  name      VARCHAR(100) NOT NULL,
  type      ENUM('expense','income') NOT NULL DEFAULT 'expense',
  icon      VARCHAR(50) NULL,
  color     VARCHAR(20) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_user_name (user_id, name, type),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  account_id    BIGINT UNSIGNED NOT NULL,
  to_account_id BIGINT UNSIGNED NULL,
  category_id   BIGINT UNSIGNED NULL,
  type          ENUM('expense','income','transfer') NOT NULL,
  amount        BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(255) NOT NULL,
  note          TEXT NULL,
  occurred_at   DATE NOT NULL,
  status        ENUM('completed','pending') NOT NULL DEFAULT 'completed',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tx_user_date (user_id, occurred_at),
  KEY idx_tx_user_category (user_id, category_id),
  KEY idx_tx_account (account_id),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_to_account FOREIGN KEY (to_account_id) REFERENCES accounts (id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS budgets (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  period      CHAR(7) NOT NULL,
  amount      BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budgets (user_id, category_id, period),
  CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  description   VARCHAR(255) NULL,
  icon          VARCHAR(50) NULL,
  color         VARCHAR(20) NULL,
  target_amount BIGINT UNSIGNED NOT NULL,
  saved_amount  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  deadline      DATE NULL,
  kind          ENUM('savings','goal') NOT NULL DEFAULT 'savings',
  status        ENUM('active','done','archived') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_user (user_id),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goal_contributions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  goal_id        BIGINT UNSIGNED NOT NULL,
  amount         BIGINT UNSIGNED NOT NULL,
  contributed_at DATE NOT NULL,
  note           VARCHAR(255) NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contrib_goal (goal_id),
  CONSTRAINT fk_contrib_goal FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recurring_bills (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  category_id   BIGINT UNSIGNED NULL,
  account_id    BIGINT UNSIGNED NULL,
  amount        BIGINT UNSIGNED NOT NULL,
  frequency     ENUM('weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
  next_due_date DATE NOT NULL,
  auto_pay      TINYINT(1) NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  icon          VARCHAR(50) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bills_user_due (user_id, next_due_date),
  CONSTRAINT fk_bills_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_bills_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_bills_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
