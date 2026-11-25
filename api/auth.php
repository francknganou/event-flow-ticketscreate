<?php
require __DIR__.'/../database/runtime.php';
$d=body();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(['error'=>'Méthode invalide'],405);
if (($_GET['action'] ?? '') === 'logout') { $u=requireUser();$header=$_SERVER['HTTP_AUTHORIZATION']??'';preg_match('/^Bearer\s+(.+)$/i',$header,$m);$q=$pdo->prepare('DELETE FROM api_tokens WHERE user_id=? AND token_hash=?');$q->execute([$u['id'],hash('sha256',$m[1])]);reply(['ok'=>true]); }
rateLimit(($_GET['action']??'login')==='signup'?'signup':'login',($_GET['action']??'')==='signup'?5:10,60);
if (($_GET['action'] ?? '') === 'signup') {
  $q=$pdo->prepare('INSERT INTO users(first_name,last_name,email,password_hash,role) VALUES(?,?,?,?,?)');
  try {$q->execute([$d['firstName'],$d['lastName'],$d['email'],password_hash($d['password'],PASSWORD_DEFAULT),'user']);}
  catch(PDOException $e){reply(['error'=>'Cette adresse e-mail est déjà utilisée.'],409);}
  $userId=(int)$pdo->lastInsertId();$token=bin2hex(random_bytes(32));$s=$pdo->prepare('INSERT INTO api_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 DAY))');$s->execute([$userId,hash('sha256',$token)]);
  reply(['id'=>$userId,'email'=>$d['email'],'role'=>'user','token'=>$token]);
}
$q=$pdo->prepare('SELECT id,email,password_hash,role,first_name,last_name FROM users WHERE email=?');$q->execute([$d['email']]);$u=$q->fetch();
if(!$u || !password_verify($d['password'],$u['password_hash'])) reply(['error'=>'E-mail ou mot de passe incorrect.'],401);
unset($u['password_hash']);$token=bin2hex(random_bytes(32));$s=$pdo->prepare('INSERT INTO api_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 DAY))');$s->execute([$u['id'],hash('sha256',$token)]);$u['token']=$token;reply($u);
