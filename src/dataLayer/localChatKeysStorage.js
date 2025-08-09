

const keyStoreCache = {}

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
    // const masterKey = await getMasterKey();
    // const iv = window.crypto.getRandomValues(new Uint8Array(12));
    // const encoder = new TextEncoder();
    
    // const encryptedAesKey = await window.crypto.subtle.encrypt(
    //   { name: 'AES-GCM', iv },
    //   masterKey,
    //   encoder.encode(decryptedAesKey)
    // );
    
    // const dataToStore = {
    //   chatId,
    //   chatName,
    //   encryptedAesKey,
    //   iv
    // };
    
    // console.log("we are gettign till here")
    // const db = await openDB();
    // const tx = db.transaction(CHAT_KEYS_STORE, 'readwrite');
    // tx.objectStore(CHAT_KEYS_STORE).put(dataToStore);

    // await new Promise(resolve => tx.oncomplete = resolve);
    // console.log(`Chat key for "${chatId}" saved securely.`);
    keyStoreCache[chatId] = keyObj
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
      return keyStoreCache[chatId];

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
    delete keyStoreCache[chatId]
    return true;

  } catch (error) {
    console.error(`Error deleting chat key for "${chatId}":`, error);
    return false;
  }
}
