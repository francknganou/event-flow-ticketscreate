<?php
require __DIR__.'/../database/runtime.php';
ensureSubscriptionSchema();
$user=requireUser();
rateLimit('booking:'.$user['id'],15,60);
if($_SERVER['REQUEST_METHOD']==='PATCH'){
  if(!in_array($user['role'],['admin','organizer'],true))reply(['error'=>'Action réservée à l’organisateur.'],403);$d=body();$ticketId=(string)($d['ticketId']??'');if(!preg_match('/^[a-f0-9]{32}$/',$ticketId))reply(['error'=>'Billet invalide.'],422);
  $pdo->beginTransaction();$q=$pdo->prepare('SELECT t.event_id,t.status,e.organizer_id FROM issued_tickets t JOIN events e ON e.id=t.event_id WHERE t.id=? FOR UPDATE');$q->execute([$ticketId]);$ticket=$q->fetch();if(!$ticket){$pdo->rollBack();reply(['error'=>'Billet introuvable.'],404);}if($user['role']!=='admin'&&(int)$ticket['organizer_id']!==(int)$user['id']){$pdo->rollBack();reply(['error'=>'Ce billet appartient à un autre organisateur.'],403);}if($ticket['status']!=='valid'){$pdo->rollBack();reply(['error'=>'Seul un billet valide peut être annulé.'],409);}
  $pdo->prepare("UPDATE issued_tickets SET status='cancelled' WHERE id=? AND status='valid'")->execute([$ticketId]);$pdo->prepare('INSERT INTO audit_log(actor_email,action,entity_type,entity_id,details) VALUES(?,?,?,?,?)')->execute([$user['email'],'ticket.cancelled','ticket',$ticketId,json_encode(['event_id'=>$ticket['event_id'],'reason'=>substr((string)($d['reason']??''),0,250)])]);$pdo->commit();reply(['updated'=>true,'status'=>'cancelled']);
}
if($_SERVER['REQUEST_METHOD']==='GET') {
  expirePendingBookings();
  $q=$pdo->prepare('SELECT * FROM bookings WHERE user_email=? ORDER BY created_at DESC');$q->execute([$user['email']]);$rows=$q->fetchAll();
  foreach($rows as &$row){$row['user']=json_decode($row['user_info'],true);$row['tickets']=json_decode($row['tickets'],true);$row['id']=(string)$row['id'];$t=$pdo->prepare('SELECT qr_cipher,scanned_at FROM issued_tickets WHERE booking_id=?');$t->execute([$row['id']]);$row['passes']=[];foreach($t->fetchAll() as $pass){$raw=base64_decode($pass['qr_cipher'],true);if($raw!==false && strlen($raw)>28){$iv=substr($raw,0,12);$tag=substr($raw,12,16);$cipher=substr($raw,28);$token=openssl_decrypt($cipher,'aes-256-gcm',hash('sha256',ticketSecret(),true),OPENSSL_RAW_DATA,$iv,$tag);if($token!==false)$row['passes'][]=['code'=>$token,'scannedAt'=>$pass['scanned_at']];}}}
  reply($rows);
}
$d=body();$eventId=(int)($d['eventId']??0);$requested=$d['tickets']??[];
if(!$eventId || !is_array($requested)) reply(['error'=>'Sélection de tickets invalide.'],422);
$quantity=array_sum(array_map(fn($n)=>max(0,(int)$n),$requested));
if($quantity<1 || $quantity>10) reply(['error'=>'Choisissez de 1 à 10 tickets par réservation.'],422);
try {
  $pdo->beginTransaction();
  $q=$pdo->prepare('SELECT * FROM events WHERE id=? FOR UPDATE');$q->execute([$eventId]);$event=$q->fetch();
  if(!$event) { $pdo->rollBack();reply(['error'=>'Événement introuvable.'],404); }
  if($event['status']!=='published'||$event['visibility']!=='public') { $pdo->rollBack();reply(['error'=>'Cet événement ne prend pas de réservations pour le moment.'],409); }
  $q=$pdo->prepare("SELECT id,tickets FROM bookings WHERE event_id=? AND status='pending_payment' AND expires_at<NOW() FOR UPDATE");$q->execute([$eventId]);$expired=$q->fetchAll();
  $restore=0;foreach($expired as $b){$oldTickets=json_decode($b['tickets'],true)?:[];$restore+=array_sum(array_map('intval',$oldTickets));$pdo->prepare("UPDATE bookings SET status='expired' WHERE id=?")->execute([$b['id']]);foreach($oldTickets as $typeId=>$qty)$pdo->prepare('UPDATE event_ticket_types SET available_quantity=LEAST(quantity,available_quantity+?) WHERE event_id=? AND id=?')->execute([(int)$qty,$eventId,(string)$typeId]);}
  if($restore){$pdo->prepare('UPDATE events SET available_tickets=LEAST(capacity,available_tickets+?) WHERE id=?')->execute([$restore,$eventId]);$event['available_tickets']=min((int)$event['capacity'],(int)$event['available_tickets']+$restore);}
  if((int)$event['available_tickets']<$quantity){$pdo->rollBack();reply(['error'=>'Il ne reste pas assez de places. Actualisez les disponibilités.'],409);}
  $types=$pdo->prepare('SELECT id,name,price,available_quantity,max_per_order,sales_start,sales_end FROM event_ticket_types WHERE event_id=? FOR UPDATE');$types->execute([$eventId]);$typeRows=$types->fetchAll();$hasDbTypes=(bool)$typeRows;if(!$typeRows)$typeRows=[['id'=>'standard','name'=>'Standard','price'=>$event['price'],'available_quantity'=>$event['available_tickets'],'max_per_order'=>10,'sales_start'=>null,'sales_end'=>null]];
  $byId=[];foreach($typeRows as $type)$byId[(string)$type['id']]=$type;$clean=[];$total=0;
  foreach($requested as $key=>$n){$n=max(0,(int)$n);if(!$n)continue;$key=(string)$key;if(!isset($byId[$key])){$pdo->rollBack();reply(['error'=>'Le type de billet sélectionné n’existe plus. Actualisez la page.'],409);} $type=$byId[$key];$now=time();if($type['sales_start']&&strtotime($type['sales_start'])>$now){$pdo->rollBack();reply(['error'=>'La vente de ce type de billet n’a pas encore commencé.'],409);}if($type['sales_end']&&strtotime($type['sales_end'])<$now){$pdo->rollBack();reply(['error'=>'La vente de ce type de billet est terminée.'],409);}if($n>(int)$type['max_per_order']){$pdo->rollBack();reply(['error'=>'La limite par commande pour ce type de billet est de '.$type['max_per_order'].'.'],422);}if((int)$type['available_quantity']<$n){$pdo->rollBack();reply(['error'=>'Il ne reste pas assez de tickets de ce type.'],409);}$clean[$key]=$n;$total+=(float)$type['price']*$n;}
  if($hasDbTypes)foreach($clean as $key=>$n)$pdo->prepare('UPDATE event_ticket_types SET available_quantity=available_quantity-? WHERE event_id=? AND id=?')->execute([$n,$eventId,$key]);
  $total=round($total,2);$status=$total>0?'pending_payment':'confirmed';
  $info=['firstName'=>$user['first_name'],'lastName'=>$user['last_name'],'email'=>$user['email'],'phone'=>substr(trim((string)($d['user']['phone']??'')),0,30)];
  $ins=$pdo->prepare('INSERT INTO bookings(event_id,event_title,event_date,location,user_email,user_info,tickets,total,status,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)');
  $ins->execute([$eventId,$event['title'],$event['event_date'],$event['location'],$user['email'],json_encode($info),json_encode($clean),$total,$status,$total>0?date('Y-m-d H:i:s',time()+900):null]);$bookingId=(int)$pdo->lastInsertId();
  $pdo->prepare('UPDATE events SET available_tickets=available_tickets-? WHERE id=?')->execute([$quantity,$eventId]);
  $codes=[];
  if($status==='confirmed') foreach($clean as $typeId=>$typeQuantity) for($i=0;$i<(int)$typeQuantity;$i++){
    $id=bin2hex(random_bytes(16));$sig=hash_hmac('sha256','EF1.'.$id,ticketSecret());$token='EF1:'.$id.'.'.$sig;
    $iv=random_bytes(12);$tag='';$cipher=openssl_encrypt($token,'aes-256-gcm',hash('sha256',ticketSecret(),true),OPENSSL_RAW_DATA,$iv,$tag);$encrypted=base64_encode($iv.$tag.$cipher);
    $pdo->prepare('INSERT INTO issued_tickets(id,booking_id,event_id,token_hash,qr_cipher,ticket_type_id) VALUES(?,?,?,?,?,?)')->execute([$id,$bookingId,$eventId,hash('sha256',$token),$encrypted,(string)$typeId]);$codes[]=$token;
  }
  $action=$status==='confirmed'?'booking.confirmed':'booking.payment_pending';
  $pdo->prepare('INSERT INTO audit_log(actor_email,action,entity_type,entity_id,details) VALUES(?,?,?,?,?)')->execute([$user['email'],$action,'booking',(string)$bookingId,json_encode(['quantity'=>$quantity,'total'=>$total])]);
  $pdo->commit();reply(['id'=>(string)$bookingId,'status'=>$status,'total'=>$total,'quantity'=>$quantity,'expiresAt'=>$status==='pending_payment'?date(DATE_ATOM,time()+900):null,'ticketCodes'=>$codes]);
} catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();reply(['error'=>'La réservation n’a pas pu être enregistrée.'],500);}
