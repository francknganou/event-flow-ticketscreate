CREATE TABLE IF NOT EXISTS email_verifications (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_expiry
  ON email_verifications(expires_at, verified_at);
