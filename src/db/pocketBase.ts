import type { Db } from "./interfaces";
import PocketBase from "pocketbase";
import type { CollectionModel } from "pocketbase";
import { PocketBaseConfig } from "../config";
import { QdChapterInfo, QdBookInfo, PagedData, QdChapterSimpleInfo, QdChapterHistoryInfo } from "../types";
import { hash_qdchapter_info } from "../utils/qd";
import { loadConfig, saveConfig } from "../utils";

const QD_CHAPTERS_FIELDS = [
    {
        'name': 'chapterId',
        'type': 'number',
        'required': true,
    },
    {
        'name': 'bookId',
        'type': 'number',
        'required': true,
    },
    {
        'name': 'time',
        'type': 'number',
        'required': true,
    },
    {
        'name': 'hash',
        'type': 'text',
        'required': true,
    },
    {
        'name': 'data',
        'type': 'json',
        'required': true,
    }
];
const QD_BOOKS_FIELDS = [
    {
        'name': 'bookId',
        'type': 'number',
        'required': true,
    },
    {
        'name': 'name',
        'type': 'text',
        'required': true,
    },
    {
        'name': 'data',
        'type': 'json',
        'required': true,
    }
];
const QD_CHAPTERS_INDEXES = [
    'CREATE INDEX `idx_{name}_cid` ON `{name}` (chapterId)',
    'CREATE INDEX `idx_{name}_bid` ON `{name}` (bookId)',
    'CREATE INDEX `idx_{name}_hash` ON `{name}` (chapterId,bookId,hash)',
    'CREATE INDEX `idx_{name}_time` ON `{name}` (chapterId,bookId,time)',
]
const QD_BOOKS_INDEXES = [
    'CREATE UNIQUE INDEX `idx_{name}_bid` ON `{name}` (bookId)',
    'CREATE INDEX `idx_{name}_name` ON `{name}` (name)',
]

export class PocketBaseDb implements Db {
    client: PocketBase;
    cfg: PocketBaseConfig;
    use_token: boolean = false;
    constructor(cfg: PocketBaseConfig) {
        this.cfg = cfg;
        this.client = new PocketBase(cfg.url);
        this.client.autoCancellation(false);
    }
    async auth() {
        await this.client.collection('_superusers').authWithPassword(this.cfg.username, this.cfg.password);
        if (!this.client.authStore.isValid) {
            throw new Error('Failed to authenticate with PocketBase. Please check your credentials.');
        }
        await saveConfig(`${this.cfg.url}/${this.cfg.username}.token`, this.client.authStore.token);
    }
    async _collections() {
        try {
            return await this.client.collections.getFullList({filter: this.cfg.prefix ? `name ~ "${this.cfg.prefix}%"` : undefined});
        } catch (e) {
            if (this.use_token) {
                this.use_token = false;
                this.client.authStore.clear();
                await this.auth();
                return await this.client.collections.getFullList({filter: this.cfg.prefix ? `name ~ "${this.cfg.prefix}%"` : undefined});
            }
            throw e;
        }
    }
    async init() {
        const token = await loadConfig(`${this.cfg.url}/${this.cfg.username}.token`, "");
        if (token) {
            this.client.authStore.save(token);
            this.use_token = true;
        } else {
            await this.auth();
        }
        const collections = await this._collections();
        const collectionNames = new Set(collections.map(c => c.name));
        if (!collectionNames.has(`${this.cfg.prefix}qd_chapters`)) {
            await this.createCollection('qd_chapters', QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES);
        } else {
            const target = collections.find(c => c.name === `${this.cfg.prefix}qd_chapters`)!;
            if (!this.checkCollection(target, QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES)) {
                await this.updateCollection('qd_chapters', QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES);
            }
        }
        if (!collectionNames.has(`${this.cfg.prefix}qd_books`)) {
            await this.createCollection('qd_books', QD_BOOKS_FIELDS, QD_BOOKS_INDEXES);
        } else {
            const target = collections.find(c => c.name === `${this.cfg.prefix}qd_books`)!;
            if (!this.checkCollection(target, QD_BOOKS_FIELDS, QD_BOOKS_INDEXES)) {
                await this.updateCollection('qd_books', QD_BOOKS_FIELDS, QD_BOOKS_INDEXES);
            }
        }
    }
    async createCollection(name: string, fields: Record<string, unknown>[], indexes: string[]) {
        const nindexes = indexes.map(i => i.replaceAll('{name}', `${this.cfg.prefix}${name}`));
        await this.client.collections.create({
            name: `${this.cfg.prefix}${name}`,
            type: 'base',
            fields: fields,
            indexes: nindexes,
        });
    }
    async updateCollection(name: string, fields: Record<string, unknown>[], indexes: string[]) {
        const nidexes = indexes.map(i => i.replaceAll('{name}', `${this.cfg.prefix}${name}`));
        await this.client.collections.update(`${this.cfg.prefix}${name}`, {
            fields: fields,
            indexes: nidexes,
        });
    }
    checkCollection(col: CollectionModel, fields: Record<string, unknown>[], indexes: string[]) {
        for (const field of fields) {
            const name = field.name;
            const target = col.fields.find(f => f.name === name);
            if (!target) {
                return false;
            }
            for (const key in field) {
                if (field[key] !== target[key]) {
                    return false;
                }
            }
        }
        for (const index of indexes) {
            const tindex = index.replaceAll('{name}', col.name);
            if (!col.indexes.includes(tindex)) {
                return false;
            }
        }
        return true;
    }
    async saveQdChapter(info: QdChapterInfo) {
        const hash = hash_qdchapter_info(info);
        const existed = await this.hasQdChapter(info.id, info.bookId, hash);
        if (existed) {
            console.log(`Chapter ${info.id} of book ${info.bookId} already exists in database, skipping`);
            return;
        }
        info.hash = undefined;
        const re = await this.client.collection(`${this.cfg.prefix}qd_chapters`).create({
            chapterId: info.id,
            bookId: info.bookId,
            time: info.time,
            hash: hash,
            data: info,
        });
        console.log(re);
    }
    async saveQdBook(info: QdBookInfo) {
        const id = await this.getQdBookId(info.id);
        if (id) {
            await this.client.collection(`${this.cfg.prefix}qd_books`).update(id, {
                name: info.bookName,
                data: info,
            });
        } else {
            await this.client.collection(`${this.cfg.prefix}qd_books`).create({
                bookId: info.id,
                name: info.bookName,
                data: info,
            });
        }
    }
    async updateQdChapter(info: QdChapterInfo): Promise<unknown> {
        const data = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getList(1, 1, {
            filter: `chapterId = ${info.id} && bookId = ${info.bookId} && time = ${info.time}`,
            fields: 'id',
        });
        const id = data.totalItems > 0 ? data.items[0].id : null;
        if (!id) {
            throw new Error(`Chapter ${info.id} of book ${info.bookId} with time ${info.time} not found in database, cannot update`);
        }
        const hash = hash_qdchapter_info(info);
        info.hash = undefined;
        info.time = Date.now();
        await this.client.collection(`${this.cfg.prefix}qd_chapters`).update(id, {
            hash: hash,
            data: info,
            time: info.time,
        });
        return id;
    }
    async getQdBookId(id: number): Promise<string | null> {
        const records = await this.client.collection(`${this.cfg.prefix}qd_books`).getList(1, 1, {
            filter: `bookId = ${id}`,
            fields: 'id',
        });
        return records.totalItems > 0 ? records.items[0].id : null;
    }
    async hasQdChapter(id: number, bookId: number, hash: string) {
        const records = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getList(1, 1, {
            filter: `chapterId = ${id} && bookId = ${bookId} && hash = "${hash}"`,
            fields: 'id',
        });
        return records.totalItems > 0;
    }
    async getQdBooks(page: number, pageSize: number): Promise<PagedData<QdBookInfo>> {
        const records = await this.client.collection(`${this.cfg.prefix}qd_books`).getList(page, pageSize, {
            fields: 'data',
            sort: 'bookId',
        });
        return {
            total: records.totalItems,
            page,
            totalPages: records.totalPages,
            pageSize,
            items: records.items.map(item => item.data),
        };
    }
    async getQdBook(id: number): Promise<QdBookInfo | undefined> {
        const records = await this.client.collection(`${this.cfg.prefix}qd_books`).getList(1, 1, {
            filter: `bookId = ${id}`,
            fields: 'data',
        });
        return records.totalItems > 0 ? records.items[0].data : undefined;
    }
    async getQdChapterSimpleInfos(bookId: number): Promise<QdChapterSimpleInfo[]> {
        // chapterId -> [index, time]
        const currents: Map<number, [number, number]> = new Map();
        const list = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getFullList({
            filter: `bookId = ${bookId}`,
            fields: 'id,chapterId,bookId,time,data.chapterInfo.chapterName',
        });
        const re: QdChapterSimpleInfo[] = [];
        for (const item of list) {
            const data: QdChapterInfo = item.data;
            const key: number = item.chapterId;
            const value: [number, number] = [re.length, item.time];
            const oldValue = currents.get(key);
            if (oldValue && value[1] > oldValue[1]) {
                value[0] = oldValue[0];
                currents.set(key, value);
                re[oldValue[0]] = {
                    primaryKey: item.id,
                    id: item.chapterId,
                    name: data.chapterInfo.chapterName,
                    bookId: item.bookId,
                    time: item.time,
                };
            } else if (!oldValue) {
                currents.set(key, value);
                re.push({
                    primaryKey: item.id,
                    id: item.chapterId,
                    name: data.chapterInfo.chapterName,
                    bookId: item.bookId,
                    time: item.time,
                });
            }
        }
        return re;
    }
    async getQdChapter(key: unknown): Promise<QdChapterInfo | undefined> {
        const k = String(key);
        const record = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getList(1, 1, {
            filter: `id = "${k}"`,
            fields: 'data,time',
        });
        const re = record.totalItems > 0 ? record.items[0].data : undefined;
        if (re) {
            re.time = record.items[0].time;
        }
        return re;
    }
    async getQdChapterHistory(chapterId: number): Promise<QdChapterHistoryInfo[]> {
        const records = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getFullList({
            filter: `chapterId = ${chapterId}`,
            fields: 'id,time,data.chapterInfo.chapterName',
            sort: '-time',
        });
        return records.map(item => ({
            primaryKey: item.id,
            name: item.data.chapterInfo.chapterName,
            time: item.time,
        }));
    }
    async getLatestQdChapter(id: number): Promise<QdChapterInfo | undefined> {
        const records = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getList(1, 1, {
            filter: `chapterId = ${id}`,
            fields: 'data,time',
            sort: '-time',
        });
        const record = records.totalItems > 0 ? records.items[0].data : undefined;
        if (record) {
            record.time = records.items[0].time;
        }
        return record;
    }
    async setAsLatestQdChapter(key: unknown): Promise<unknown> {
        await this.client.collection(`${this.cfg.prefix}qd_chapters`).update(String(key), {
            time: Date.now(),
        });
        return key;
    }
    close(): void {
        this.client.cancelAllRequests();
        this.client.authStore.clear();
    }
}

