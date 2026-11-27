-- One-time, idempotent copy from EventFlow's legacy tables into the
-- organization/order/ticket model added by marketplace-v2-d1.sql.
-- Run only after taking a D1 export backup.
PRAGMA foreign_keys = ON;

-- Event staff become organization members with controller access. Preserve
-- owners already seeded by the schema migration.
INSERT OR IGNORE INTO organization_members(organization_id,user_id,role)
SELECT DISTINCT o.id,es.user_id,'controller'
FROM event_staff es
JOIN events e ON e.id=es.event_id
JOIN organizations o ON o.owner_user_id=e.organizer_id;

-- Copy explicitly configured ticket types. Prefix ids by event because legacy
-- type ids were only unique within an event.
INSERT OR IGNORE INTO ticket_types(id,event_id,name,description,zone,price,quota,sold_count,sales_start,sales_end)
SELECT 'legacy-' || t.event_id || '-' || t.id,t.event_id,t.name,t.description,'standard',
       CAST(round(t.price) AS INTEGER),MAX(t.quantity,1),0,t.sales_start,t.sales_end
FROM event_ticket_types t;

-- Legacy events without configured types used the event-level price and a
-- single Standard tier.
INSERT OR IGNORE INTO ticket_types(id,event_id,name,description,zone,price,quota,sold_count)
SELECT 'legacy-' || e.id || '-standard',e.id,'Standard','Migrated default ticket type','standard',
       CAST(round(e.price) AS INTEGER),MAX(e.capacity,1),0
FROM events e
WHERE NOT EXISTS (SELECT 1 FROM event_ticket_types t WHERE t.event_id=e.id);

-- Carry booking history, including expired/failed records. Buyer contact
-- details remain in the same D1 database; consent is left NULL unless it was
-- stored explicitly by the original schema.
INSERT OR IGNORE INTO orders(public_id,event_id,buyer_name,buyer_email,buyer_phone,currency,subtotal,fees,total,status,reserved_until,consent_at,created_at)
SELECT 'legacy-booking-' || b.id,b.event_id,
       trim(COALESCE(json_extract(b.user_info,'$.firstName'),'') || ' ' || COALESCE(json_extract(b.user_info,'$.lastName'),'')),
       b.user_email,json_extract(b.user_info,'$.phone'),'XAF',CAST(round(b.total) AS INTEGER),0,
       CAST(round(b.total) AS INTEGER),
       CASE b.status WHEN 'confirmed' THEN 'paid' WHEN 'pending_payment' THEN 'pending'
         WHEN 'expired' THEN 'expired' WHEN 'cancelled' THEN 'cancelled'
         WHEN 'refunded' THEN 'refunded' ELSE 'failed' END,
       b.expires_at,NULL,b.created_at
FROM bookings b;

-- Paid or still-pending orders carry line items into the new inventory model.
-- Failed, expired, cancelled and refunded orders retain their order history
-- without reserving stock again.
INSERT OR IGNORE INTO order_items(order_id,ticket_type_id,quantity,unit_price)
SELECT o.id,tt.id,CAST(j.value AS INTEGER),CAST(round(COALESCE(old_type.price,e.price)) AS INTEGER)
FROM bookings b
JOIN orders o ON o.public_id='legacy-booking-' || b.id
JOIN events e ON e.id=b.event_id
JOIN json_each(b.tickets) j
LEFT JOIN event_ticket_types old_type ON old_type.event_id=e.id AND old_type.id=j.key
JOIN ticket_types tt ON tt.event_id=e.id AND tt.id=CASE
  WHEN old_type.id IS NOT NULL THEN 'legacy-' || e.id || '-' || old_type.id
  ELSE 'legacy-' || e.id || '-standard' END
WHERE b.status IN ('confirmed','pending_payment') AND CAST(j.value AS INTEGER)>0;

-- Synchronize aggregate inventory to the source of truth after trigger-based
-- line-item insertion. This preserves the legacy event/type availability.
UPDATE ticket_types SET sold_count=MAX(0,(
  SELECT t.quantity-t.available_quantity FROM event_ticket_types t
  WHERE ticket_types.id='legacy-' || t.event_id || '-' || t.id LIMIT 1
)) WHERE EXISTS (SELECT 1 FROM event_ticket_types t
  WHERE ticket_types.id='legacy-' || t.event_id || '-' || t.id);
UPDATE ticket_types SET sold_count=MAX(0,(
  SELECT e.capacity-e.available_tickets FROM events e WHERE e.id=ticket_types.event_id
)) WHERE ticket_types.id='legacy-' || ticket_types.event_id || '-standard'
  AND NOT EXISTS (SELECT 1 FROM event_ticket_types t WHERE t.event_id=ticket_types.event_id);

-- Carry existing subscription payment attempts without duplicating them.
INSERT INTO payments(subscription_id,provider,provider_reference,amount,currency,status,created_at)
SELECT sp.subscription_id,COALESCE(sp.provider,'unconfigured'),sp.provider_reference,sp.amount,
       COALESCE(sp.currency,'XAF'),sp.status,sp.created_at
FROM subscription_payments sp
WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.subscription_id=sp.subscription_id
  AND p.provider=COALESCE(sp.provider,'unconfigured')
  AND COALESCE(p.provider_reference,'')=COALESCE(sp.provider_reference,'')
  AND p.amount=sp.amount AND p.created_at=sp.created_at);

-- Retain the audit trail in the normalized audit table.
INSERT INTO audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,details,created_at)
SELECT u.id,a.actor_email,a.action,a.entity_type,a.entity_id,a.details,a.created_at
FROM audit_log a LEFT JOIN users u ON u.email=a.actor_email
WHERE NOT EXISTS (SELECT 1 FROM audit_logs x WHERE x.actor_email=a.actor_email
  AND x.action=a.action AND x.entity_type=a.entity_type AND x.entity_id=a.entity_id
  AND x.details IS a.details AND x.created_at=a.created_at);
