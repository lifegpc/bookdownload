import { IndexedDbConfig } from "../config";
import type { QdChapterInfo } from "../types";
import { compress, isServiceWorker } from "../utils";
import { hash_qdchapter_info } from "../utils/qd";
import type { Db } from "./interfaces";

async function make_storage_persist() {
    const persisted = await navigator.storage.persisted();
    if (!persisted) {
        await navigator.storage.persist();
    }
}

async function save_data<T>(db: IDBDatabase, storeName: string, data: T, key?: IDBValidKey) {
    return new Promise<IDBValidKey>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = key !== undefined ? store.put(data, key) : store.put(data);
        req.onsuccess = () => {
            resolve(req.result);
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}

type QdChapterKey = [number, number, number];
type QdChapterHashKey = [number, number, string];

async function get_data<T>(db: IDBDatabase, storeName: string, key: IDBValidKey | IDBKeyRange, index?: string): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = index ? store.index(index).get(key) : store.get(key);
        req.onsuccess = () => {
            resolve(req.result);
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}

type GetAllOptions = {
    index?: string;
    count?: number;
}

async function get_datas<T>(db: IDBDatabase, storeName: string, key?: IDBValidKey | IDBKeyRange, options?: GetAllOptions): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = options?.index ? store.index(options.index).getAll(key, options.count) : store.getAll(key, options?.count);
        req.onsuccess = () => {
            resolve(req.result);
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}

async function get_keys<K extends IDBValidKey = IDBValidKey>(db: IDBDatabase, storeName: string, query?: IDBValidKey | IDBKeyRange, options?: GetAllOptions): Promise<K[]> {
    return new Promise<K[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = options?.index ? store.index(options.index).getAllKeys(query, options.count) : store.getAllKeys(query, options?.count);
        req.onsuccess = () => {
            resolve(req.result as K[]);
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}
type CompressedQdChapterInfo = {
    compressed: Uint8Array;
    bookId: number;
    id: number;
    time: number;
    hash: string;
}

export class IndexedDb implements Db {
    compress: boolean;
    _qddb?: IDBDatabase;
    constructor(cfg: IndexedDbConfig) {
        this.compress = cfg.compress;
    }
    get qddb() {
        if (!this._qddb) {
            throw new Error('Database not initialized');
        }
        return this._qddb;
    }
    init_qddb() {
        return new Promise<void>((resolve, reject) => {
            let dbreq = indexedDB.open('qd', 1);
            dbreq.onupgradeneeded = function (event) {
                let db = this.result;
                console.log('Upgrading qd database from version', event.oldVersion, 'to', event.newVersion);
                const nan = isNaN(event.oldVersion);
                if (nan || event.oldVersion < 1) {
                    db.createObjectStore('books', { keyPath: 'id' });
                    const chapters = db.createObjectStore('chapters', { keyPath: ['id', 'bookId', 'time'] });
                    chapters.createIndex('bookId', 'bookId');
                    chapters.createIndex('id', 'id');
                    chapters.createIndex('hash', ['id', 'bookId', 'hash']);
                }
            }
            dbreq.onerror = () => {
                reject(dbreq.error);
            }
            dbreq.onsuccess = () => {
                this._qddb = dbreq.result;
                resolve();
            }
        });
    }
    async init() {
        if (!isServiceWorker) make_storage_persist();
        await this.init_qddb();
    }
    async saveQdChapter(info: QdChapterInfo) {
        const hash = hash_qdchapter_info(info);
        const key: QdChapterHashKey = [info.id, info.bookId, hash];
        const existed = await get_data<CompressedQdChapterInfo | QdChapterInfo>(this.qddb, 'chapters', key, 'hash');
        if (existed) {
            console.log(`Chapter ${info.id} of book ${info.bookId} already exists in database, skipping`);
            return;
        }
        if (this.compress) {
            info.hash = undefined;
            const data = JSON.stringify(info);
            const encoded = new TextEncoder().encode(data);
            const compressed = await compress(encoded);
            const compressedInfo: CompressedQdChapterInfo = {
                compressed,
                bookId: info.bookId,
                id: info.id,
                time: info.time,
                hash,
            }
            await save_data(this.qddb, 'chapters', compressedInfo);
        } else {
            info.hash = hash;
            await save_data(this.qddb, 'chapters', info);
        }
    }
    close() {
        this.qddb.close();
    }
}

function deleteIndexedDb(name: string) {
    return new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => {
            resolve();
        }
        req.onerror = () => {
            reject(req.error);
        }
        req.onblocked = () => {
            reject(new Error('Delete blocked'));
        }
    });
}


export async function clearIndexedDb() {
    for (const info of await indexedDB.databases()) {
        if (info?.name) {
            await deleteIndexedDb(info.name);
        }
    }
}
