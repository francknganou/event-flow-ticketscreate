CREATE TABLE IF NOT EXISTS user_account_status (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('active','disabled','deleted')),
  changed_by INTEGER REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_account_status_status
  ON user_account_status(status, changed_at);
