-- Migration v2 (Cloudflare D1 / SQLite). Apply once after d1-schema.sql.
-- Keeps legacy EventFlow tables while introducing organization-level billing,
-- guest orders, check-in devices and explicit audit records.
PRAGMA foreign_keys = ON;

-- Keep the administrator address aligned with the requested account identity.
UPDATE users SET email='lebronzefranck@gmail.com'
 WHERE email='franck06.nganou02oumbe2004@gmail.com' AND role='admin'
   AND NOT EXISTS (SELECT 1 FROM users WHERE email='lebronzefranck@gmail.com');

CREATE TABLE organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  logo_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner','manager','seller','controller','accountant')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id,user_id)
);

ALTER TABLE subscriptions ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE events ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
INSERT INTO organizations(name,owner_user_id)
 SELECT trim(first_name || ' ' || last_name),id FROM users WHERE role IN ('organizer','admin')
 ON CONFLICT(owner_user_id) DO NOTHING;
INSERT INTO organization_members(organization_id,user_id,role)
 SELECT o.id,u.id,CASE WHEN u.role='admin' THEN 'owner' ELSE 'owner' END
 FROM organizations o JOIN users u ON u.id=o.owner_user_id
 ON CONFLICT(organization_id,user_id) DO NOTHING;
UPDATE subscriptions SET organization_id=(SELECT id FROM organizations WHERE owner_user_id=subscriptions.organizer_id)
 WHERE organization_id IS NULL;
UPDATE events SET organization_id=(SELECT id FROM organizations WHERE owner_user_id=events.organizer_id)
 WHERE organization_id IS NULL;

CREATE TABLE ticket_types (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  zone TEXT NOT NULL DEFAULT 'standard',
  price INTEGER NOT NULL CHECK(price >= 0),
  quota INTEGER NOT NULL CHECK(quota >= 0),
  sold_count INTEGER NOT NULL DEFAULT 0 CHECK(sold_count >= 0 AND sold_count <= quota),
  sales_start TEXT,
  sales_end TEXT
);
CREATE TABLE promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent','fixed')),
  discount_value INTEGER NOT NULL CHECK(discount_value > 0),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  UNIQUE(event_id,code)
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  currency TEXT NOT NULL DEFAULT 'XAF',
  subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
  fees INTEGER NOT NULL DEFAULT 0 CHECK(fees >= 0),
  total INTEGER NOT NULL CHECK(total >= 0),
  status TEXT NOT NULL CHECK(status IN ('pending','paid','failed','expired','cancelled','refunded')),
  reserved_until TEXT,
  consent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
  UNIQUE(order_id,ticket_type_id)
);
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  provider TEXT NOT NULL CHECK(provider IN ('visa','mastercard','orange_money','mtn_momo','cash','unconfigured')),
  provider_reference TEXT UNIQUE,
  amount INTEGER NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL CHECK(status IN ('pending','paid','failed','refunded')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK((order_id IS NOT NULL) + (subscription_id IS NOT NULL) = 1)
);
CREATE TABLE refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  amount INTEGER NOT NULL CHECK(amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('requested','approved','rejected','paid')),
  requested_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  event_id INTEGER NOT NULL REFERENCES events(id),
  ticket_type_id TEXT NOT NULL REFERENCES ticket_types(id),
  attendee_name TEXT NOT NULL,
  qr_token TEXT NOT NULL UNIQUE,
  qr_signature TEXT NOT NULL,
  qr_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN ('valid','used','cancelled','refunded','expired','transferred')),
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ticket_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  transfer_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted','cancelled','expired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE gates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(event_id,name)
);
CREATE TABLE scan_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  gate_id INTEGER NOT NULL REFERENCES gates(id),
  controller_user_id INTEGER NOT NULL REFERENCES users(id),
  device_key_hash TEXT NOT NULL UNIQUE,
  last_sync_at TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT REFERENCES tickets(id),
  gate_id INTEGER NOT NULL REFERENCES gates(id),
  device_id INTEGER REFERENCES scan_devices(id),
  controller_user_id INTEGER NOT NULL REFERENCES users(id),
  result TEXT NOT NULL CHECK(result IN ('accepted','already_used','cancelled','forged','unknown','wrong_event','wrong_zone','offline_conflict')),
  scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL UNIQUE
);
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  recipient_email TEXT,
  channel TEXT NOT NULL CHECK(channel IN ('email','sms','whatsapp','in_app')),
  template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT CHECK(details IS NULL OR json_valid(details)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Organization membership is the billing owner; an administrator may create
-- events without a subscription. The API repeats these checks for clear UX.
CREATE TRIGGER events_require_active_subscription
BEFORE INSERT ON events
WHEN COALESCE((SELECT role FROM users WHERE id=NEW.organizer_id),'') <> 'admin'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM organization_members m
    JOIN subscriptions s ON (s.organization_id=m.organization_id OR (s.organization_id IS NULL AND s.organizer_id=m.user_id))
    WHERE m.user_id=NEW.organizer_id AND m.role IN ('owner','manager')
      AND s.status IN ('active','grace')
      AND (s.ends_at IS NULL OR datetime(s.ends_at) >= datetime('now'))
  ) THEN RAISE(ABORT,'SUBSCRIPTION_REQUIRED') END;
  SELECT CASE WHEN (
    SELECT p.max_events FROM organization_members m
    JOIN subscriptions s ON (s.organization_id=m.organization_id OR (s.organization_id IS NULL AND s.organizer_id=m.user_id))
    JOIN plans p ON p.id=s.plan_id
    WHERE m.user_id=NEW.organizer_id AND m.role IN ('owner','manager')
      AND (s.organization_id=m.organization_id OR (s.organization_id IS NULL AND s.organizer_id=m.user_id))
      AND s.status IN ('active','grace') ORDER BY s.id DESC LIMIT 1
  ) IS NOT NULL AND (
    SELECT COUNT(*) FROM events e WHERE e.organizer_id=NEW.organizer_id
      AND e.status IN ('draft','published','ongoing')
  ) >= (
    SELECT p.max_events FROM organization_members m
    JOIN subscriptions s ON (s.organization_id=m.organization_id OR (s.organization_id IS NULL AND s.organizer_id=m.user_id))
    JOIN plans p ON p.id=s.plan_id
    WHERE m.user_id=NEW.organizer_id AND m.role IN ('owner','manager')
      AND s.status IN ('active','grace') AND (s.ends_at IS NULL OR datetime(s.ends_at)>=datetime('now')) ORDER BY s.id DESC LIMIT 1
  ) THEN RAISE(ABORT,'EVENT_LIMIT_REACHED') END;
END;

CREATE TRIGGER ticket_types_enforce_plan_limits
BEFORE INSERT ON event_ticket_types
WHEN COALESCE((SELECT role FROM users WHERE id=(SELECT organizer_id FROM events WHERE id=NEW.event_id)),'') <> 'admin'
BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM event_ticket_types WHERE event_id=NEW.event_id) >= COALESCE((
    SELECT p.max_ticket_types FROM subscriptions s JOIN plans p ON p.id=s.plan_id
    WHERE s.organizer_id=(SELECT organizer_id FROM events WHERE id=NEW.event_id)
      AND s.status IN ('active','grace') ORDER BY s.id DESC LIMIT 1
  ),2147483647) THEN RAISE(ABORT,'TICKET_TYPE_LIMIT_REACHED') END;
  SELECT CASE WHEN NEW.quantity + COALESCE((SELECT SUM(quantity) FROM event_ticket_types WHERE event_id=NEW.event_id),0) > COALESCE((
    SELECT p.max_tickets_per_event FROM subscriptions s JOIN plans p ON p.id=s.plan_id
    WHERE s.organizer_id=(SELECT organizer_id FROM events WHERE id=NEW.event_id)
      AND s.status IN ('active','grace') ORDER BY s.id DESC LIMIT 1
  ),2147483647) THEN RAISE(ABORT,'TICKET_QUOTA_REACHED') END;
END;

CREATE TRIGGER order_items_reserve_stock
BEFORE INSERT ON order_items
WHEN (SELECT sold_count + NEW.quantity > quota FROM ticket_types WHERE id=NEW.ticket_type_id)
BEGIN SELECT RAISE(ABORT,'TICKET_STOCK_UNAVAILABLE'); END;
CREATE TRIGGER order_items_increment_stock
AFTER INSERT ON order_items
BEGIN UPDATE ticket_types SET sold_count=sold_count+NEW.quantity WHERE id=NEW.ticket_type_id; END;
CREATE TRIGGER scans_use_ticket_once
BEFORE INSERT ON scans
WHEN NEW.result='accepted'
BEGIN
  SELECT CASE WHEN COALESCE((SELECT status FROM tickets WHERE id=NEW.ticket_id),'') <> 'valid'
    THEN RAISE(ABORT,'TICKET_ALREADY_USED_OR_INVALID') END;
  UPDATE tickets SET status='used',used_at=NEW.scanned_at WHERE id=NEW.ticket_id AND status='valid';
END;

CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_subscriptions ON subscriptions(organization_id,status);
CREATE INDEX idx_orders_event_status ON orders(event_id,status,created_at);
CREATE INDEX idx_ticket_token ON tickets(qr_token);
CREATE INDEX idx_scans_event_time ON scans(gate_id,scanned_at);
CREATE INDEX idx_notifications_pending ON notifications(status,scheduled_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type,entity_id,created_at);

-- Ensure the four reference plans exist. Prices are FCFA; annual prices give
-- two months free. These are seed defaults and may be adjusted by the owner.
INSERT INTO plans(id,name,monthly_price,annual_price,max_events,max_tickets_per_event,max_ticket_types,max_controllers,commission,features)
VALUES
 ('free','Découverte',0,0,1,50,1,1,7,'["QR numérique","Rapports de base"]'),
 ('starter','Starter',5000,50000,3,300,3,3,5,'["QR numérique","Scan hors ligne","Support e-mail"]'),
 ('pro','Pro',15000,150000,15,2000,NULL,10,3,'["Scan hors ligne","Codes promo","Rapports et exports","Personnalisation"]'),
 ('business','Business',40000,400000,NULL,NULL,NULL,NULL,1.5,'["Toutes les fonctions","Domaine personnalisé","Support dédié"]')
ON CONFLICT(id) DO UPDATE SET name=excluded.name,monthly_price=excluded.monthly_price,annual_price=excluded.annual_price,
 max_events=excluded.max_events,max_tickets_per_event=excluded.max_tickets_per_event,
 max_ticket_types=excluded.max_ticket_types,max_controllers=excluded.max_controllers,
 commission=excluded.commission,features=excluded.features;
