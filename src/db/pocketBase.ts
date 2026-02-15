import type { Db } from "./interfaces";
import PocketBase from "pocketbase";
import type { CollectionModel } from "pocketbase";
import { PocketBaseConfig } from "../config";
import { QdChapterInfo } from "../types";
import { hash_qdchapter_info } from "../utils/qd";

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
const QD_CHAPTERS_INDEXES = [
    'CREATE INDEX `idx_cid` ON `{name}` (chapterId)',
    'CREATE INDEX `idx_bid` ON `{name}` (bookId)',
    'CREATE INDEX `idx_hash` ON `{name}` (chapterId,bookId,hash)',
]

export class PocketBaseDb implements Db {
    client: PocketBase;
    cfg: PocketBaseConfig;
    constructor(cfg: PocketBaseConfig) {
        this.cfg = cfg;
        this.client = new PocketBase(cfg.url);
    }
    async init() {
        await this.client.collection('_superusers').authWithPassword(this.cfg.username, this.cfg.password);
        if (!this.client.authStore.isValid) {
            throw new Error('Failed to authenticate with PocketBase. Please check your credentials.');
        }
        const collections = await this.client.collections.getFullList({filter: this.cfg.prefix ? `name ~ "${this.cfg.prefix}%"` : undefined});
        const collectionNames = new Set(collections.map(c => c.name));
        if (!collectionNames.has(`${this.cfg.prefix}qd_chapters`)) {
            await this.createCollection('qd_chapters', QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES);
        } else {
            const target = collections.find(c => c.name === `${this.cfg.prefix}qd_chapters`)!;
            if (!this.checkCollection(target, QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES)) {
                await this.updateCollection('qd_chapters', QD_CHAPTERS_FIELDS, QD_CHAPTERS_INDEXES);
            }
        }
    }
    async createCollection(name: string, fields: Record<string, unknown>[], indexes: string[]) {
        await this.client.collections.create({
            name: `${this.cfg.prefix}${name}`,
            type: 'base',
            fields: fields,
            indexes: indexes,
        });
    }
    async updateCollection(name: string, fields: Record<string, unknown>[], indexes: string[]) {
        const nidexes = indexes.map(i => i.replace('{name}', `${this.cfg.prefix}${name}`));
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
            const tindex = index.replace('{name}', col.name);
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
    async hasQdChapter(id: number, bookId: number, hash: string) {
        const records = await this.client.collection(`${this.cfg.prefix}qd_chapters`).getList(1, 1, {
            filter: `chapterId = ${id} && bookId = ${bookId} && hash = "${hash}"`,
            fields: 'id',
        });
        return records.totalItems > 0;
    }
    close(): void {
        this.client.cancelAllRequests();
        this.client.authStore.clear();
    }
}

