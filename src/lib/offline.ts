import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'shamba_ai_offline';
const STORE_NAME = 'sync_queue';

export interface SyncJob {
  id: string;
  imageBlob: Blob;
  cropType: string;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const addToQueue = async (job: SyncJob) => {
  const db = await getDB();
  await db.put(STORE_NAME, job);
};

export const getPendingJobs = async (): Promise<SyncJob[]> => {
  const db = await getDB();
  return db.getAll(STORE_NAME);
};

export const removeJob = async (id: string) => {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
};
