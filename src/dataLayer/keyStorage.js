import { openDB } from 'idb';

// Open the database (returns a Promise)
const dbPromise = () =>
  openDB('crypto-key-store', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'keyId' });
      }
    },
  });

/**
 * Save key to IndexedDB
 * @param {Object} keyObj { keyId, publicKey, privateKey }
 * @returns {Promise}
 */
function saveKeyToBrowser(keyObj) {
  return new Promise((resolve, reject) => {
    dbPromise()
      .then((db) => db.put('keys', keyObj))
      .then(() => {
        console.log('Key saved:', keyObj.keyId);
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
function getKeyFromBrowser(keyId) {
  return new Promise((resolve, reject) => {
    dbPromise()
      .then((db) => db.get('keys', keyId))
      .then((result) => {
        if (result) {
          console.log('Key retrieved:', result);
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
function deleteKeyFromBrowser(keyId) {
  return new Promise((resolve, reject) => {
    dbPromise()
      .then((db) => db.delete('keys', keyId))
      .then(() => {
        console.log('Key deleted:', keyId);
        resolve(true);
      })
      .catch((err) => {
        console.error('Error deleting key:', err);
        reject(err);
      });
  });
}

export { saveKeyToBrowser, getKeyFromBrowser, deleteKeyFromBrowser };
