-- EventFlow D1 schema (SQLite). Apply with: wrangler d1 execute eventflow --remote --file=database/d1-schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_account_status (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('active','disabled','deleted')),
  changed_by INTEGER REFERENCES users(id),
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  annual_price INTEGER NOT NULL DEFAULT 0,
  max_events INTEGER,
  max_tickets_per_event INTEGER,
  max_ticket_types INTEGER,
  max_controllers INTEGER,
  commission NUMERIC NOT NULL DEFAULT 0,
  features TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  end_date TEXT,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT,
  capacity INTEGER NOT NULL,
  available_tickets INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','ongoing','completed','cancelled')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_ticket_types (
  id TEXT NOT NULL,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  max_per_order INTEGER NOT NULL DEFAULT 10,
  sales_start TEXT,
  sales_end TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id,id)
);

CREATE TABLE IF NOT EXISTS organizer_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_staff (
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id,user_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER REFERENCES events(id),
  event_title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  location TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_info TEXT NOT NULL CHECK(json_valid(user_info)),
  tickets TEXT NOT NULL CHECK(json_valid(tickets)),
  total NUMERIC NOT NULL,
  status TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issued_tickets (
  id TEXT PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  token_hash TEXT NOT NULL UNIQUE,
  qr_cipher TEXT NOT NULL,
  scanned_at TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid','used','cancelled','refunded','expired','transferred')),
  ticket_type_id TEXT,
  entry_point TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL REFERENCES plans(id),
  billing_period TEXT NOT NULL CHECK(billing_period IN ('monthly','annual')),
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN ('pending_payment','active','grace','expired','cancelled','suspended')),
  starts_at TEXT,
  ends_at TEXT,
  renewal_auto INTEGER NOT NULL DEFAULT 0,
  adjustment_type TEXT NOT NULL DEFAULT 'none' CHECK(adjustment_type IN ('none','percent','fixed')),
  adjustment_value NUMERIC NOT NULL DEFAULT 0,
  adjustment_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  provider TEXT NOT NULL DEFAULT 'unconfigured',
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  payload TEXT CHECK(payload IS NULL OR json_valid(payload)),
  processed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider,provider_event_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'issued',
  pdf_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT CHECK(details IS NULL OR json_valid(details)),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  window_started TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status,event_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organizer_status ON subscriptions(organizer_id,status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_reference ON subscription_payments(provider_reference);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_created ON messages(sender_id,recipient_id,created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read ON messages(recipient_id,read_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON issued_tickets(event_id,status);
