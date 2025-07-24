import { openDB } from 'idb';

// Open the database (returns a Promise)
const dbChatKeyPromise = () =>
  openDB('local-chat-keys-storage', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'chatId' });
      }
    },
  });

/**
 * Save key to IndexedDB
 * @param {Object} keyObj { chatId, chatName, decryptedAesKey }
 * @returns {Promise}
 */
function saveChatAesKeyToBrowser(keyObj) {
  return new Promise((resolve, reject) => {
    dbChatKeyPromise()
      .then((db) => db.put('keys', keyObj))
      .then(() => {
        //console.log('Key saved:', keyObj.chatId);
        resolve(true);
      })
      .catch((err) => {
        console.error('Error saving key:', err);
        reject(err);
      });
  });
}

/**
 * Get key from IndexedDB by keyId
 * @param {string} keyId
 * @returns {Promise<Object>}
 */
function getAesKeyKeyFromBrowser(keyId) {
  return new Promise((resolve, reject) => {
    dbChatKeyPromise()
      .then((db) => db.get('keys', keyId))
      .then((result) => {
        if (result) {
          //console.log('Key retrieved:', result);
          resolve(result);
        } else {
          reject('Key not found');
        }
      })
      .catch((err) => {
        console.error('Error retrieving key:', err);
        reject(err);
      });
  });
}

/**
 * Delete key from IndexedDB
 * @param {string} keyId
 * @returns {Promise}
 */
function deleteChatAesKeyFromBrowser(keyId) {
  return new Promise((resolve, reject) => {
    dbChatKeyPromise()
      .then((db) => db.delete('keys', keyId))
      .then(() => {
        //console.log('Key deleted:', keyId);
        resolve(true);
      })
      .catch((err) => {
        console.error('Error deleting key:', err);
        reject(err);
      });
  });
}

export { saveChatAesKeyToBrowser, getAesKeyKeyFromBrowser, deleteChatAesKeyFromBrowser };
