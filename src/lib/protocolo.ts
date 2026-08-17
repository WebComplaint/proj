const PROTOCOL_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function gerarProtocolo(data = new Date()) {
  const year = data.getFullYear();
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes, (byte) => PROTOCOL_ALPHABET[byte % PROTOCOL_ALPHABET.length]).join("");

  return `DEN-${year}-${randomPart}`;
}
