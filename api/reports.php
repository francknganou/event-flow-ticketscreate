<?php
require __DIR__.'/../database/runtime.php';
$user=requireOrganizer();
$organizerOnly=$user['role']==='admin'?'':' WHERE e.organizer_id=?';
$params=$user['role']==='admin'?[]:[$user['id']];
$eventsQ=$pdo->prepare('SELECT e.id,e.title,e.event_date AS date,e.capacity,e.status,e.organizer_id FROM events e'.$organizerOnly.' ORDER BY e.event_date DESC');
$eventsQ->execute($params);$events=$eventsQ->fetchAll();
$eventStats=[];$capacity=0;foreach($events as $e){$id=(string)$e['id'];$eventStats[$id]=['id'=>$id,'title'=>$e['title'],'date'=>$e['date'],'status'=>$e['status'],'capacity'=>(int)$e['capacity'],'sold'=>0,'checkedIn'=>0];$capacity+=(int)$e['capacity'];}
$typeQ=$pdo->prepare('SELECT t.event_id,t.id,t.name,t.price,t.quantity FROM event_ticket_types t JOIN events e ON e.id=t.event_id'.($user['role']==='admin'?'':' WHERE e.organizer_id=?').' ORDER BY e.event_date DESC,t.created_at');
$typeQ->execute($params);$types=[];$typeRows=$typeQ->fetchAll();foreach($typeRows as $t){$key=(string)$t['event_id'].'|'.$t['id'];$types[$key]=['eventId'=>(string)$t['event_id'],'name'=>$t['name'],'price'=>(float)$t['price'],'quantity'=>(int)$t['quantity'],'sold'=>0,'revenue'=>0.0];}
$bookingsQ=$pdo->prepare("SELECT b.id,b.event_id,b.tickets,b.total,b.status,b.user_email,b.created_at FROM bookings b JOIN events e ON e.id=b.event_id".($user['role']==='admin'?'':' WHERE e.organizer_id=?'));
$bookingsQ->execute($params);$bookings=$bookingsQ->fetchAll();
$revenue=0.0;$sold=0;$attendees=[];$pending=0;$orders=0;$monthMap=[];
for($i=11;$i>=0;$i--){$d=new DateTimeImmutable('first day of this month');$d=$d->modify('-'.$i.' months');$key=$d->format('Y-m');$monthMap[$key]=['month'=>$key,'label'=>$d->format('M Y'),'revenue'=>0.0,'tickets'=>0];}
foreach($bookings as $b){if($b['status']==='pending_payment'){$pending++;continue;}if($b['status']!=='confirmed')continue;$orders++;$revenue+=(float)$b['total'];$attendees[$b['user_email']]=true;$ticketCounts=json_decode($b['tickets'],true)?:[];$monthKey=date('Y-m',strtotime($b['created_at']));
  foreach($ticketCounts as $typeId=>$quantity){$quantity=max(0,(int)$quantity);if(!$quantity)continue;$key=(string)$b['event_id'].'|'.$typeId;$price=$types[$key]['price']??0.0;$sold+=$quantity;if(isset($eventStats[(string)$b['event_id']]))$eventStats[(string)$b['event_id']]['sold']+=$quantity;if(isset($types[$key])){$types[$key]['sold']+=$quantity;$types[$key]['revenue']+=$quantity*$price;}if(isset($monthMap[$monthKey])){$monthMap[$monthKey]['tickets']+=$quantity;$monthMap[$monthKey]['revenue']+=$quantity*$price;}}
}
$checkSql='SELECT t.event_id,COUNT(*) FROM issued_tickets t JOIN events e ON e.id=t.event_id WHERE t.scanned_at IS NOT NULL'.($user['role']==='admin'?'':' AND e.organizer_id=?').' GROUP BY t.event_id';$checkQ=$pdo->prepare($checkSql);$checkQ->execute($params);foreach($checkQ->fetchAll(PDO::FETCH_NUM) as [$id,$count])if(isset($eventStats[(string)$id]))$eventStats[(string)$id]['checkedIn']=(int)$count;
$capacityRatio=$capacity>0?round($sold/$capacity*100,1):0;
reply(['stats'=>['events'=>count($events),'capacity'=>$capacity,'sold'=>$sold,'revenue'=>round($revenue,2),'attendees'=>count($attendees),'orders'=>$orders,'pending'=>$pending,'checkedIn'=>array_sum(array_column($eventStats,'checkedIn')),'fillRate'=>$capacityRatio],'monthlySales'=>array_values($monthMap),'ticketTypes'=>array_values($types),'events'=>array_values($eventStats)]);
