/**
 * O QUE ESTE ARQUIVO FAZ
 *
 * Confere e arruma o TELEFONE informado na denuncia. E usado nas duas pontas:
 * no formulario, para aplicar a mascara enquanto a pessoa digita, e no
 * servidor, para recusar numeros que nao existem.
 *
 * O formato aceito e o brasileiro, sempre com DDD:
 *   celular -> (11) 91234-5678  (11 digitos, comeca com 9)
 *   fixo    -> (11) 3123-4567   (10 digitos, comeca de 2 a 8)
 *
 * Para a apresentacao: e o que garante um telefone de contato utilizavel.
 */

// BLOCO 1 - Fica so com os numeros. Se a pessoa colou o numero com o codigo
// do Brasil na frente (+55), ele e descartado.
export function digitosTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, "");

  return digitos.length > 11 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
}

// BLOCO 2 - O numero e valido? DDD sem zero, e depois celular ou fixo.
export function telefoneValido(valor: string) {
  return /^[1-9]{2}(9\d{8}|[2-8]\d{7})$/.test(digitosTelefone(valor));
}

// BLOCO 3 - A mascara: transforma 11912345678 em (11) 91234-5678.
// Funciona tambem com o numero pela metade, enquanto a pessoa ainda digita.
export function formatarTelefone(valor: string) {
  const d = digitosTelefone(valor).slice(0, 11);

  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
