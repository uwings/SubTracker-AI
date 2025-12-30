
import { Subscription } from './types';

const DB_NAME = 'SubTrackerDB';
const STORE_NAME = 'subscriptions';
const VERSION = 3;

/**
 * Initializes the IndexedDB database.
 * Version 3 ensures 'uid' index exists for reliable data synchronization.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('uid', 'uid', { unique: true });
      } else {
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains('uid')) {
            store.createIndex('uid', 'uid', { unique: true });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Fetches all subscription records.
 */
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Saves or updates a single subscription.
 * Uses UID to find existing records to maintain ID consistency.
 */
export const saveSubscription = async (sub: Subscription): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('uid');
    
    const getRequest = index.get(sub.uid);
    
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      const subToSave = { ...sub };
      if (existing) {
        subToSave.id = existing.id;
      } else {
        // If it's a new UID, let the DB generate the ID
        delete (subToSave as any).id;
      }
      const putRequest = store.put(subToSave);
      putRequest.onsuccess = () => resolve(putRequest.result as number);
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Sequential import logic for better stability.
 * Processes items one by one within a single transaction.
 */
export const importSubscriptions = async (subs: Subscription[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const uidIndex = store.index('uid');

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('Transaction aborted'));

    let currentIndex = 0;

    const processNext = () => {
      if (currentIndex >= subs.length) {
        return;
      }

      const sub = subs[currentIndex];
      if (!sub || !sub.uid) {
        currentIndex++;
        processNext();
        return;
      }

      // 1. Look up existing record by UID
      const getReq = uidIndex.get(sub.uid);
      
      getReq.onsuccess = () => {
        const existing = getReq.result;
        // 2. Prepare data by stripping imported ID and applying local ID if found
        const subToSave = { ...sub };
        delete (subToSave as any).id; 
        
        if (existing) {
          subToSave.id = existing.id;
        }

        // 3. Write record
        const putReq = store.put(subToSave);
        putReq.onsuccess = () => {
          currentIndex++;
          processNext();
        };
        putReq.onerror = () => {
          transaction.abort();
          reject(new Error(`Failed to store item at index ${currentIndex}`));
        };
      };

      getReq.onerror = () => {
        transaction.abort();
        reject(new Error(`Failed to query item at index ${currentIndex}`));
      };
    };

    processNext();
  });
};

/**
 * Deletes a subscription record by internal ID.
 */
export const deleteSubscription = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clears all subscription records.
 */
export const clearAllSubscriptions = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
