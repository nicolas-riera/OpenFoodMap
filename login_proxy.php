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
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headersText = substr($response, 0, $headerSize);
$bodyText = substr($response, $headerSize);

preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headersText, $matches);
foreach ($matches[1] as $item) {
    header("Set-Cookie: $item; Path=/; Secure; SameSite=Lax", false);
}

http_response_code($httpCode);
header('Content-Type: application/json');

$data = json_decode($bodyText, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    if ($httpCode === 200 && (strpos($bodyText, 'user_id') !== false || strpos($bodyText, $user_id) !== false)) {
        echo json_encode(['success' => true, 'username' => $user_id]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Identifiants incorrects.']);
    }
} else {
    if (!isset($data['success']) && $httpCode === 200) {
        $data['success'] = true;
    }
    echo json_encode($data);
}
?>