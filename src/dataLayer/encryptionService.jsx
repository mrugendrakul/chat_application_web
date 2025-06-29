import { Buffer } from 'buffer';
import NodeRSA from "node-rsa";
import AESKeyData from './AESKeyData';

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
    return crypto.subtle.importKey("raw", raw, "AES-CBC", true, ["encrypt", "decrypt"]);
  };

  const generateRSAKeyPair = () => {
    const key = new NodeRSA({ b: 2048, environment: 'browser' });
    key.setOptions({ encryptionScheme: 'pkcs1' });

    // Export keys including headers
    const publicPem = key.exportKey('pkcs8-public-pem');
    const privatePem = key.exportKey('pkcs8-private-pem');

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

  const encryptAESKeyWithPublicKey = async (secretKey, publicKeyPem) => {
    // Export AES CryptoKey to raw bytes
    const rawKey = await crypto.subtle.exportKey("raw", secretKey); // ArrayBuffer
    const rawKeyBuffer = Buffer.from(rawKey); // Convert to Node.js Buffer

    // Format the PEM string correctly if not already
    const formattedPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`;

    // Create NodeRSA instance with proper scheme
    const rsa = new NodeRSA(formattedPem, 'pkcs8-public-pem', {
      encryptionScheme: 'pkcs1' // Matches "RSA/ECB/PKCS1Padding"
    });

    // Encrypt the AES key
    const encrypted = rsa.encrypt(rawKeyBuffer); // Returns Buffer

    return encrypted; // Return Buffer (or convert to Base64 if needed)
  };

  const decryptAESKeyWithPrivateKey = (encryptedKeyBytes, privateKeyPem) => {
    const formattedPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;

    const rsa = new NodeRSA(formattedPem, "pkcs8-private-pem", {
      encryptionScheme: "pkcs1",
    });

    const decrypted = rsa.decrypt(Buffer.from(encryptedKeyBytes, "base64"));
    return new Uint8Array(decrypted);
  };


  const aesEncrypt = (dataString, key) => {
    const iv = new Uint8Array(16);
    const dataBuffer = encoder.encode(dataString)
    return crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, dataBuffer);
  };

  const aesEncryptMessages = async (dataString, rawKeyBytes) => {
    const iv = new Uint8Array(16);
    const dataBuffer = encoder.encode(dataString)
    const key = await crypto.subtle.importKey(
      "raw",
      rawKeyBytes.buffer.slice(rawKeyBytes.byteOffset, rawKeyBytes.byteOffset + rawKeyBytes.byteLength),
      { name: "AES-CBC" },
      true,
      ["encrypt"]
    );
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      dataBuffer
    );

    return new Uint8Array(encryptedBuffer);
  };

  // const aesDecrypt = async (encryptedBuffer, key) => {
  //   const cryptoKey = await importAESKey(key);
  //   const iv = new Uint8Array(16);
  //   return crypto.subtle.decrypt({ name: "AES-CBC", iv }, cryptoKey, encryptedBuffer);
  // };

  const aesDecrypt = async (encryptedBase64, rawAesKeyBytes) => {
    // 1. Convert encrypted Base64 string → Uint8Array
    const ciphertextBytes = stringToByteArray(encryptedBase64);

    // 2. Import AES key
    const aesKey = await crypto.subtle.importKey(
      "raw",
      rawAesKeyBytes.buffer.slice(
        rawAesKeyBytes.byteOffset,
        rawAesKeyBytes.byteOffset + rawAesKeyBytes.byteLength
      ),
      { name: "AES-CBC" },
      true,
      ["decrypt"]
    );

    // 3. Prepare IV (16-byte zeroed, same as Android default)
    const iv = new Uint8Array(16);

    // 4. Decrypt ciphertext
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesKey,
      ciphertextBytes.buffer.slice(
        ciphertextBytes.byteOffset,
        ciphertextBytes.byteOffset + ciphertextBytes.byteLength
      )
    );

    // 5. Convert decrypted ArrayBuffer → UTF-8 string
    return new TextDecoder().decode(decryptedBuffer);
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
    decryptPrivateKeyWithPassword,
    aesEncryptMessages
  };
})();

export default EncryptionService;
