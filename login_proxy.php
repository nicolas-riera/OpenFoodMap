<?php
$user_id = $_POST['user_id'] ?? '';
$password = $_POST['password'] ?? '';

$url = 'https://world.openfoodfacts.org/cgi/session.pl';
$ch = curl_init($url);

$postData = http_build_query(['user_id' => $user_id, 'password' => $password]);

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'OpenFoodMap/1.0 (contact@openfoodmap.local)');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HEADER, true); // On garde les headers pour voir les cookies

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// On renvoie exactement le code reçu (200 si OK, 403 si erreur)
http_response_code($httpCode);
echo $response;
?>