// secureKeyStore.js

// --- Constants ---
const DB_NAME = 'app-secure-vault';
const MASTER_KEY_STORE = 'master_key_store';
const USER_KEYS_STORE = 'user_keys';
const MASTER_KEY_ID = 'master-encryption-key';

// --- IndexedDB Setup ---
// This function now sets up two object stores: one for the master key and one for user keys.
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3); // Version updated for new schema

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MASTER_KEY_STORE)) {
        db.createObjectStore(MASTER_KEY_STORE);
      }
      if (!db.objectStoreNames.contains(USER_KEYS_STORE)) {
        db.createObjectStore(USER_KEYS_STORE, { keyPath: 'keyId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves (or creates if not found) the master encryption key.
 * This key is non-extractable and is used to encrypt/decrypt user private keys.
 * @returns {Promise<CryptoKey>} The master key handle.
 */
async function getMasterKey() {
  const db = await openDB();
  let tx = db.transaction(MASTER_KEY_STORE, 'readonly');
  let store = tx.objectStore(MASTER_KEY_STORE);
  
  const masterKey = await new Promise((resolve, reject) => {
      const req = store.get(MASTER_KEY_ID);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
  });

  if (masterKey) {
    return masterKey;
  }

  // If no master key exists, create one
  console.log('Master key not found. Generating a new one.');
  const newMasterKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // NON-EXTRACTABLE
    ['encrypt', 'decrypt']
  );

  tx = db.transaction(MASTER_KEY_STORE, 'readwrite');
  store = tx.objectStore(MASTER_KEY_STORE);
  store.put(newMasterKey, MASTER_KEY_ID);
  
  await new Promise(resolve => tx.oncomplete = resolve);
  
  return newMasterKey;
}


// --- Public API ---

/**
 * Encrypts the privateKey from a key object and stores the result.
 * @param {object} keyObj - The key object: { keyId, privateKey, publicKey }.
 * @returns {Promise<boolean>} - True if successful.
 */
export async function saveKeyToBrowser(keyObj) {
  const { keyId, privateKey, publicKey } = keyObj;
  if (!keyId || !privateKey || !publicKey) {
    console.error('keyObj must contain keyId, privateKey, and publicKey.');
    return false;
  }

  try {
    const masterKey = await getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encoder.encode(privateKey)
    );

    const dataToStore = {
      keyId,
      publicKey,
      encryptedPrivateKey,
      iv
    };

    const db = await openDB();
    const tx = db.transaction(USER_KEYS_STORE, 'readwrite');
    tx.objectStore(USER_KEYS_STORE).put(dataToStore);
    
    await new Promise(resolve => tx.oncomplete = resolve);
    console.log(`Key "${keyId}" saved securely.`);
    return true;

  } catch (error) {
    console.error(`Error saving key "${keyId}":`, error);
    return false;
  }
}

/**
 * Retrieves a key object and decrypts its private key.
 * @param {string} keyId - The ID of the key to retrieve.
 * @returns {Promise<Object|null>} The full key object { keyId, privateKey, publicKey } or null.
 */
export async function getKeyFromBrowser(keyId) {
  try {
    const db = await openDB();
    const tx = db.transaction(USER_KEYS_STORE, 'readonly');
    const store = tx.objectStore(USER_KEYS_STORE);

    const storedData = await new Promise((resolve, reject) => {
        const req = store.get(keyId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    if (!storedData) {
      console.warn(`Key "${keyId}" not found.`);
      return null;
    }

    const { publicKey, encryptedPrivateKey, iv } = storedData;
    const masterKey = await getMasterKey();

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedPrivateKey
    );

    const decoder = new TextDecoder();
    const privateKey = decoder.decode(decryptedBuffer);

    return { keyId, privateKey, publicKey };

  } catch (error) {
    console.error(`Error retrieving key "${keyId}":`, error);
    return null;
  }
}

/**
 * Deletes a user key from storage.
 * @param {string} keyId - The ID of the key to delete.
 * @returns {Promise<boolean>} - True if successful.
 */
export async function deleteKeyFromBrowser(keyId) {
    try {
        const db = await openDB();
        const tx = db.transaction(USER_KEYS_STORE, 'readwrite');
        tx.objectStore(USER_KEYS_STORE).delete(keyId);
        
        await new Promise(resolve => tx.oncomplete = resolve);
        console.log(`Key "${keyId}" deleted.`);
        return true;

    } catch (error) {
        console.error(`Error deleting key "${keyId}":`, error);
        return false;
    }
}
