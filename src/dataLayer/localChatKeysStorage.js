// secureChatKeyStore.js

// --- Constants ---
// These can be shared across modules if they are in the same application context.
const DB_NAME = 'app-secure-vault';
const MASTER_KEY_STORE = 'master_key_store';
const CHAT_KEYS_STORE = 'chat_keys'; // A new store for chat keys
const MASTER_KEY_ID = 'master-encryption-key';

// --- IndexedDB Setup ---
// The version is incremented to 3 to handle the new object store.
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      // Check for master key store
      if (!db.objectStoreNames.contains(MASTER_KEY_STORE)) {
        db.createObjectStore(MASTER_KEY_STORE);
      }
      // Check for the new chat keys store
      if (!db.objectStoreNames.contains(CHAT_KEYS_STORE)) {
        db.createObjectStore(CHAT_KEYS_STORE, { keyPath: 'chatId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves (or creates if not found) the master encryption key.
 * This is the same secure function used before.
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


// --- Public API for Chat Keys ---

/**
 * Encrypts the decryptedAesKey from a key object and stores the result.
 * @param {object} keyObj - The key object: { chatId, chatName, decryptedAesKey }.
 * @returns {Promise<boolean>} - True if successful.
 */
export async function saveChatAesKeyToBrowser(keyObj) {
  const { chatId, chatName, decryptedAesKey } = keyObj;
  if (!chatId || !decryptedAesKey) {
    console.error('keyObj must contain at least chatId and decryptedAesKey.');
    return false;
  }

  try {
    const masterKey = await getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const encryptedAesKey = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encoder.encode(decryptedAesKey)
    );

    const dataToStore = {
      chatId,
      chatName,
      encryptedAesKey,
      iv
    };

    const db = await openDB();
    const tx = db.transaction(CHAT_KEYS_STORE, 'readwrite');
    tx.objectStore(CHAT_KEYS_STORE).put(dataToStore);

    await new Promise(resolve => tx.oncomplete = resolve);
    console.log(`Chat key for "${chatId}" saved securely.`);
    return true;

  } catch (error) {
    console.error(`Error saving chat key for "${chatId}":`, error);
    return false;
  }
}

/**
 * Retrieves a chat key object and decrypts its AES key.
 * @param {string} chatId - The ID of the chat key to retrieve.
 * @returns {Promise<Object|null>} The full key object { chatId, chatName, decryptedAesKey } or null.
 */
export async function getAesKeyKeyFromBrowser(chatId) {
  try {
    const db = await openDB();
    const tx = db.transaction(CHAT_KEYS_STORE, 'readonly');
    const store = tx.objectStore(CHAT_KEYS_STORE);

    const storedData = await new Promise((resolve, reject) => {
      const req = store.get(chatId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!storedData) {
      console.warn(`Chat key for "${chatId}" not found.`);
      return null;
    }

    const { chatName, encryptedAesKey, iv } = storedData;
    const masterKey = await getMasterKey();

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedAesKey
    );

    const decoder = new TextDecoder();
    const decryptedAesKey = decoder.decode(decryptedBuffer);

    return { chatId, chatName, decryptedAesKey };

  } catch (error) {
    console.error(`Error retrieving chat key for "${chatId}":`, error);
    return null;
  }
}

/**
 * Deletes a chat key from storage.
 * @param {string} chatId - The ID of the chat key to delete.
 * @returns {Promise<boolean>} - True if successful.
 */
export async function deleteChatAesKeyFromBrowser(chatId) {
  try {
    const db = await openDB();
    const tx = db.transaction(CHAT_KEYS_STORE, 'readwrite');
    tx.objectStore(CHAT_KEYS_STORE).delete(chatId);

    await new Promise(resolve => tx.oncomplete = resolve);
    console.log(`Chat key for "${chatId}" deleted.`);
    return true;

  } catch (error) {
    console.error(`Error deleting chat key for "${chatId}":`, error);
    return false;
  }
}
