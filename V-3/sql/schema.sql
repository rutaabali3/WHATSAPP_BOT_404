CREATE DATABASE IF NOT EXISTS bot_404 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bot_404;

CREATE TABLE IF NOT EXISTS bot_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  chat_jid VARCHAR(255) NOT NULL,
  sender_jid VARCHAR(255) NOT NULL,
  participant_jid VARCHAR(255) NULL,
  is_from_me TINYINT(1) NOT NULL DEFAULT 0,
  message_type VARCHAR(64) NOT NULL,
  text_body TEXT NULL,
  caption TEXT NULL,
  quoted_message_id VARCHAR(255) NULL,
  raw_message JSON NOT NULL,
  media_path VARCHAR(1024) NULL,
  media_mimetype VARCHAR(255) NULL,
  media_filename VARCHAR(255) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  revoked_at TIMESTAMP(3) NULL,
  UNIQUE KEY uq_message_id (message_id),
  KEY idx_chat_created (chat_jid, created_at),
  KEY idx_quoted_message (quoted_message_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_edits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  chat_jid VARCHAR(255) NOT NULL,
  sender_jid VARCHAR(255) NOT NULL,
  original_text TEXT NULL,
  edited_text TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_edit_msg (message_id),
  KEY idx_edit_chat (chat_jid, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_ai_interactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  jid VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  source VARCHAR(64) NOT NULL DEFAULT 'mention_guide',
  latency_ms INT UNSIGNED NULL,
  tokens_used INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_jid (jid, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_users (
  jid VARCHAR(255) NOT NULL PRIMARY KEY,
  display_name VARCHAR(255) NULL,
  opted_in TINYINT(1) NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_settings (
  setting_key VARCHAR(128) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO bot_settings (setting_key, setting_value) VALUES
  ('antidelete', 'on'),
  ('antiedit', 'on'),
  ('antistatus', 'on'),
  ('autostatus', 'off'),
  ('smartmode', 'on'),
  ('bot_enabled', 'on'),
  ('prefix', '.'),
  ('message_retention_days', '30')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);

CREATE TABLE IF NOT EXISTS bot_groups (
  jid VARCHAR(255) NOT NULL PRIMARY KEY,
  subject VARCHAR(255) NULL,
  protection_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trusted_entities (
  jid VARCHAR(255) NOT NULL PRIMARY KEY,
  entity_type ENUM('user','group') NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(128) NULL,
  latency_ms INT UNSIGNED NULL,
  status INT NULL,
  is_fallback TINYINT(1) NOT NULL DEFAULT 0,
  jid VARCHAR(255) NULL,
  command_name VARCHAR(64) NULL,
  request_key VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_usage_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bot_audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_name VARCHAR(128) NOT NULL,
  actor_jid VARCHAR(255) NULL,
  jid VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'success',
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_created (created_at),
  KEY idx_audit_event (event_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_game_profiles (
  jid VARCHAR(255) NOT NULL PRIMARY KEY,
  display_name VARCHAR(255) NULL,
  total_games INT UNSIGNED NOT NULL DEFAULT 0,
  wins INT UNSIGNED NOT NULL DEFAULT 0,
  losses INT UNSIGNED NOT NULL DEFAULT 0,
  draws INT UNSIGNED NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_game_score (score DESC)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_game_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  jid VARCHAR(255) NOT NULL,
  game_name VARCHAR(64) NOT NULL,
  opponent_jid VARCHAR(255) NULL,
  result ENUM('win', 'loss', 'draw') NOT NULL,
  points_change INT NOT NULL DEFAULT 0,
  details JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_user_history (jid, created_at)
) ENGINE=InnoDB;

