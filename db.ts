
import { Subscription, BillingCycle, PaymentPlatform } from './types';

const DB_NAME = 'SubTrackerDB';
const STORE_NAME = 'subscriptions';
const VERSION = 6;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('uid', 'uid', { unique: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const validateAndClean = (item: any): Subscription | null => {
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name || '未命名服务');
  const cost = parseFloat(item.cost) || 0;
  const uid = item.uid || crypto.randomUUID();
  
  return {
    uid,
    name,
    cost,
    currency: item.currency || 'CNY',
    billingCycle: (Object.values(BillingCycle).includes(item.billingCycle) ? item.billingCycle : BillingCycle.MONTHLY),
    startDate: item.startDate || new Date().toISOString(),
    endDate: item.endDate,
    durationMonths: item.durationMonths,
    autoRenew: item.autoRenew !== undefined ? !!item.autoRenew : true,
    category: item.category || '生活',
    platform: (Object.values(PaymentPlatform).includes(item.platform) ? item.platform : PaymentPlatform.OTHER),
    status: item.status === 'canceled' ? 'canceled' : 'active',
    notes: item.notes || '',
    updatedAt: Number(item.updatedAt) || Date.now(),
    logoUrl: item.logoUrl || '',
    websiteUrl: item.websiteUrl || '',
    billingUrl: item.billingUrl || ''
  };
};

export const importSubscriptions = async (subs: any[]): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const uidIndex = store.index('uid');

  for (const rawItem of subs) {
    const cleanedItem = validateAndClean(rawItem);
    if (!cleanedItem) continue;

    await new Promise<void>((resolve, reject) => {
      const getReq = uidIndex.get(cleanedItem.uid);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        const itemToSave = { ...cleanedItem };
        if (existing) {
          itemToSave.id = existing.id;
        } else {
          delete (itemToSave as any).id;
        }
        const putReq = store.put(itemToSave);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

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

export const saveSubscription = async (sub: Subscription): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const uidIndex = store.index('uid');
    const getReq = uidIndex.get(sub.uid);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      const subToSave = { ...sub };
      if (existing) subToSave.id = existing.id;
      const putReq = store.put(subToSave);
      putReq.onsuccess = () => resolve(putReq.result as number);
      putReq.onerror = () => reject(putReq.error);
    };
  });
};

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
