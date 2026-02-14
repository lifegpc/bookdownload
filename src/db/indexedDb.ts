import { IndexedDbConfig } from "../config";
import type { QdChapterInfo } from "../types";
import { compress } from "../utils";

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

type CompressedQdChapterInfo = {
    compressed: Uint8Array;
    bookId: number;
    id: number;
    time: number;
}

export class IndexedDb {
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
        make_storage_persist();
        await this.init_qddb();
    }
    async saveQdChapter(info: QdChapterInfo) {
        if (this.compress) {
            const data = JSON.stringify(info);
            const encoded = new TextEncoder().encode(data);
            const compressed = await compress(encoded);
            const compressedInfo: CompressedQdChapterInfo = {
                compressed,
                bookId: info.bookId,
                id: info.id,
                time: info.time,
            }
            await save_data(this.qddb, 'chapters', compressedInfo);
        } else {
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
