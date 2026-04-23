<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Cache-Control: no-cache, no-store');

$arquivo = __DIR__ . '/contador.json';

// Lê o arquivo atual ou inicializa
function lerContador($arquivo) {
    if (!file_exists($arquivo)) {
        return ['total' => 0, 'hoje' => 0, 'ultima_data' => date('Y-m-d')];
    }
    $dados = json_decode(file_get_contents($arquivo), true);
    if (!$dados) {
        return ['total' => 0, 'hoje' => 0, 'ultima_data' => date('Y-m-d')];
    }
    return $dados;
}

// Salva com lock para evitar conflito em acessos simultâneos
function salvarContador($arquivo, $dados) {
    $fp = fopen($arquivo, 'c+');
    if (!$fp) return false;
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($dados));
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    return true;
}

$acao = $_GET['acao'] ?? 'ler';
$hoje = date('Y-m-d');
$dados = lerContador($arquivo);

// Reseta o contador do dia se mudou a data
if ($dados['ultima_data'] !== $hoje) {
    $dados['hoje'] = 0;
    $dados['ultima_data'] = $hoje;
}

if ($acao === 'incrementar') {
    $dados['total']++;
    $dados['hoje']++;
    salvarContador($arquivo, $dados);
}

echo json_encode([
    'total' => $dados['total'],
    'hoje'  => $dados['hoje']
]);
