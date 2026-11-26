<?php
declare(strict_types=1);

// Export existing MySQL rows as SQLite-compatible INSERT statements for D1.
// Run from PowerShell: php database/export-mysql-to-d1.php > $env:TEMP\eventflow-d1-data.sql
$dsn = getenv('EVENTFLOW_MYSQL_DSN') ?: 'mysql:host=127.0.0.1;dbname=eventflow;charset=utf8mb4';
$user = getenv('EVENTFLOW_MYSQL_USER') ?: 'root';
$password = getenv('EVENTFLOW_MYSQL_PASSWORD') ?: '';
$pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$tables = [
    'users', 'plans', 'events', 'event_ticket_types', 'organizer_requests', 'event_staff',
    'bookings', 'api_tokens', 'issued_tickets', 'subscriptions', 'subscription_payments',
    'payment_events', 'invoices', 'messages', 'audit_log', 'api_rate_limits',
];
$quote = static function (mixed $value) use ($pdo): string {
    if ($value === null) return 'NULL';
    if (is_bool($value) || is_int($value) || is_float($value)) return (string)$value;
    return chr(39) . str_replace(chr(39), chr(39) . chr(39), (string)$value) . chr(39);
};
foreach ($tables as $table) {
    $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $columns = array_map(static fn(string $column): string => '"' . str_replace('"', '""', $column) . '"', array_keys($row));
        $values = array_map($quote, array_values($row));
        echo 'INSERT OR REPLACE INTO "' . $table . '" (' . implode(',', $columns) . ') VALUES (' . implode(',', $values) . ");\n";
    }
}
