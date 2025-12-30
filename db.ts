
import { Subscription, BillingCycle, PaymentPlatform } from './types';

const DB_NAME = 'SubTrackerDB';
const STORE_NAME = 'subscriptions';
const VERSION = 6; // 升级版本以确保索引最新

/**
 * 初始化数据库
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
        const store = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORE_NAME);
        if (!store.indexNames.contains('uid')) {
          store.createIndex('uid', 'uid', { unique: true });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 验证并清洗数据，确保所有字段符合 Subscription 接口
 */
const validateAndClean = (item: any): Subscription | null => {
  if (!item || typeof item !== 'object') return null;
  
  // 必须具备的核心字段或默认值
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
    endDate: item.endDate || undefined,
    durationMonths: item.durationMonths ? parseInt(item.durationMonths) : undefined,
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

/**
 * 导入订阅列表：使用 Promise.all 保证所有操作在同一个事务完成前被提交
 */
export const importSubscriptions = async (subs: any[]): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const uidIndex = store.index('uid');

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    subs.forEach((rawItem) => {
      const cleanedItem = validateAndClean(rawItem);
      if (!cleanedItem) return;

      const getReq = uidIndex.get(cleanedItem.uid);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        const itemToSave = { ...cleanedItem };
        
        // 如果本地已存在该 UID 的记录，保留本地 ID 进行覆盖更新
        if (existing) {
          itemToSave.id = existing.id;
        } else {
          // 如果是新记录，确保没有旧 ID 干扰自增
          delete (itemToSave as any).id;
        }
        
        store.put(itemToSave);
      };
    });
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
      // 不要删除 sub.id 如果它已经存在（手动编辑场景）
      
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
