<?php
header('Content-Type: application/json');

$user_id = $_GET['user_id'] ?? '';
if (!$user_id) {
    echo json_encode(['error' => 'missing user_id']);
    exit;
}

$url = 'https://world.openfoodfacts.org/api/v2/users/' . urlencode($user_id);
$ch = curl_init($url);
echo("tes");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'OpenFoodMap/1.0 (contact@openfoodmap.local)');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
