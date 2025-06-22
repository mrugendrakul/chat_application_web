import { Buffer } from 'buffer';
import NodeRSA from "node-rsa";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const EncryptionService = (() => {
  const stringToByteArray = (base64) =>
    Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  const byteArrayToString = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)));

  const generateRandomSalt = (length) => {
    const salt = new Uint8Array(length);
    crypto.getRandomValues(salt);
    return salt;
  };

  const generateAESKey = () =>
    crypto.subtle.generateKey(
      { name: "AES-CBC", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

  const aesKeyToString = (key) =>
    crypto.subtle.exportKey("raw", key)
      .then(raw => byteArrayToString(raw));

  const stringToAESKey = (keyStr) => {
    const raw = stringToByteArray(keyStr);
    return crypto.subtle.importKey("raw", raw, "AES-CBC", true, ["encrypt","decrypt"]);
  };

const generateRSAKeyPair = () => {
  const key = new NodeRSA({ b: 2048, environment: 'browser' });
  key.setOptions({ encryptionScheme: 'pkcs1' });

  // Export keys including headers
  const publicPem = key.exportKey('pkcs8-public-pem');
  const privatePem = key.exportKey('pkcs1-private-pem');

  // Strip PEM header/footer and whitespace in one go
  const clean = pem =>
    pem
      .replace(/-----BEGIN [\w\s]+-----/, '')
      .replace(/-----END [\w\s]+-----/, '')
      .replace(/\s+/g, '');

  return {
    publicKey: clean(publicPem),
    privateKey: clean(privatePem),
  };
};

  const publicKeyToString = (publicKeyPem) => publicKeyPem;
  const privateKeyToString = (privateKeyPem) => privateKeyPem;

  const stringToPublicKey = (publicPem) => publicPem;
  const stringToPrivateKey = (privatePem) => privatePem;

  const encryptAESKeyWithPublicKey = (aesRawBytes, publicKeyPem) => {
    const rsa = new NodeRSA(publicKeyPem, "pkcs8-public-pem", { encryptionScheme: "pkcs1" });
    return rsa.encrypt(Buffer.from(aesRawBytes));
  };

  const decryptAESKeyWithPrivateKey = (encryptedKeyBytes, privateKeyPem) => {
    const rsa = new NodeRSA(privateKeyPem, "pkcs1-private-pem", { encryptionScheme: "pkcs1" });
    const decrypted = rsa.decrypt(Buffer.from(encryptedKeyBytes));
    return new Uint8Array(decrypted);
  };

  const aesEncrypt = (dataBuffer, key) => {
    const iv = new Uint8Array(16);
    return crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, dataBuffer);
  };

  const aesDecrypt = (encryptedBuffer, key) => {
    const iv = new Uint8Array(16);
    return crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, encryptedBuffer);
  };

  const generateAESKeyFromPassword = (password, salt) => {
    return crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(passKey =>
        crypto.subtle.deriveKey(
          { name: "PBKDF2", salt, iterations: 65536, hash: "SHA-256" },
          passKey,
          { name: "AES-CBC", length: 256 },
          true,
          ["encrypt", "decrypt"]
        )
      );
  };

  const encryptPrivateKeyWithPassword = (privateKeyPem, password, salt) => {
    return generateAESKeyFromPassword(password, salt)
      .then(aesKey =>
        crypto.subtle.importKey("pkcs8", stringToByteArray(privateKeyPem), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"])
          .then(() => crypto.subtle.exportKey("pkcs8", stringToByteArray(privateKeyPem))) // incorrect but placeholder
          .then(privRaw =>
            aesEncrypt(privRaw, aesKey)
          )
      );
  };

  const decryptPrivateKeyWithPassword = (encryptedPrivateKey, password, salt) => {
    return generateAESKeyFromPassword(password, salt)
      .then(aesKey =>
        aesDecrypt(encryptedPrivateKey, aesKey)
          .then(raw => byteArrayToString(raw))
      );
  };

  return {
    stringToByteArray,
    byteArrayToString,
    generateRandomSalt,
    generateAESKey,
    aesKeyToString,
    stringToAESKey,
    generateRSAKeyPair,
    publicKeyToString,
    privateKeyToString,
    stringToPublicKey,
    stringToPrivateKey,
    encryptAESKeyWithPublicKey,
    decryptAESKeyWithPrivateKey,
    aesEncrypt,
    aesDecrypt,
    generateAESKeyFromPassword,
    encryptPrivateKeyWithPassword,
    decryptPrivateKeyWithPassword
  };
})();

export default EncryptionService;
