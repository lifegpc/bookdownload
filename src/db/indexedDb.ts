import { IndexedDbConfig } from "../config";
import type { QdChapterInfo, QdBookInfo, PagedData, QdChapterSimpleInfo } from "../types";
import { compress, decompress, isServiceWorker } from "../utils";
import { hash_qdchapter_info } from "../utils/qd";
import type { Db } from "./interfaces";

async function make_storage_persist() {
    const persisted = await navigator.storage.persisted();
    if (!persisted) {
        await navigator.storage.persist();
    }
}

function save_data<T>(db: IDBDatabase, storeName: string, data: T, key?: IDBValidKey) {
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

function get_data<T>(db: IDBDatabase, storeName: string, key: IDBValidKey | IDBKeyRange, index?: string): Promise<T | undefined> {
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

function get_datas<T>(db: IDBDatabase, storeName: string, key?: IDBValidKey | IDBKeyRange, options?: GetAllOptions): Promise<T[]> {
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

function get_data_with_convert<T, U>(db: IDBDatabase, storeName: string, convert: (key: IDBValidKey, data: T, list: U[]) => Promise<void> | void , key?: IDBValidKey | IDBKeyRange, index?: string): Promise<U[]> {
    return new Promise<U[]>((resolve, reject) => {
        const list: U[] = [];
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = index ? store.index(index).openCursor(key) : store.openCursor(key);
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                try {
                    const res = convert(cursor.primaryKey, cursor.value, list);
                    if (res instanceof Promise) {
                        res.then(() => {
                            cursor.continue();
                        }).catch(err => {
                            reject(err);
                        });
                        return;
                    }
                } catch (err) {
                    reject(err);
                    return;
                }
                cursor.continue();
            } else {
                resolve(list);
            }
        }
    });
}

function get_keys<K extends IDBValidKey = IDBValidKey>(db: IDBDatabase, storeName: string, query?: IDBValidKey | IDBKeyRange, options?: GetAllOptions): Promise<K[]> {
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

function get_count(db: IDBDatabase, storeName: string, key?: IDBValidKey | IDBKeyRange, index?: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = index ? store.index(index).count(key) : store.count(key);
        req.onsuccess = () => {
            resolve(req.result);
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}

async function get_paged_data<T>(db: IDBDatabase, storeName: string, page: number, pageSize: number, key?: IDBValidKey | IDBKeyRange, index?: string): Promise<PagedData<T>> {
    const count = await get_count(db, storeName, key, index);
    const offset = (page - 1) * pageSize;
    const totalPages = Math.ceil(count / pageSize);
    if (page > totalPages || page < 1 || count === 0) {
        return {
            total: count,
            page,
            totalPages,
            pageSize,
            items: [],
        };
    }
    return new Promise<PagedData<T>>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = index ? store.index(index).openCursor(key) : store.openCursor(key);
        const items: T[] = [];
        let advanced = false;
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                if (!advanced && offset > 0) {
                    cursor.advance(offset);
                    advanced = true;
                } else {
                    items.push(cursor.value);
                }
                if (items.length < pageSize) {
                    cursor.continue();
                } else {
                    resolve({
                        total: count,
                        page,
                        totalPages,
                        pageSize,
                        items,
                    });
                }
            } else {
                resolve({
                    total: count,
                    page,
                    totalPages,
                    pageSize,
                    items,
                });
            }
        }
        req.onerror = () => {
            reject(req.error);
        }
    });
}

type CompressedQdChapterInfo = {
    compressed: Uint8Array<ArrayBuffer>;
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
            const dbreq = indexedDB.open('qd', 1);
            dbreq.onupgradeneeded = function (event) {
                const db = this.result;
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
    async saveQdBook(info: QdBookInfo) {
        await save_data(this.qddb, 'books', info);
    }
    async getQdBooks(page: number, pageSize: number): Promise<PagedData<QdBookInfo>> {
        return await get_paged_data(this.qddb, 'books', page, pageSize);
    }
    async getQdBook(id: number): Promise<QdBookInfo | undefined> {
        return await get_data(this.qddb, 'books', id);
    }
    async getChapterSimpleInfos(bookId: number): Promise<QdChapterSimpleInfo[]> {
        // chapterId-> [index, time]
        const currents: Map<number, [number, number]> = new Map();
        return await get_data_with_convert<QdChapterInfo | CompressedQdChapterInfo, QdChapterSimpleInfo>(this.qddb, 'chapters', async (key, data, list) => {
            if ('compressed' in data) {
                const decompressed = await decompress(data.compressed);
                const decoded = new TextDecoder().decode(decompressed);
                data = JSON.parse(decoded) as QdChapterInfo;
            }
            const value: [number, number] = [list.length, data.time];
            const oldValue = currents.get(data.id);
            if (oldValue && value[1] > oldValue[1]) {
                value[0] = oldValue[0];
                currents.set(data.id, value);
                list[oldValue[0]] = {
                    primaryKey: key,
                    id: data.id,
                    name: data.chapterInfo.chapterName,
                    bookId: data.bookId,
                };
            } else if (!oldValue) {
                currents.set(data.id, value);
                list.push({
                    primaryKey: key,
                    id: data.id,
                    name: data.chapterInfo.chapterName,
                    bookId: data.bookId,
                });
            }
        }, bookId, 'bookId');
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
