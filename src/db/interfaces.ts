import { DbConfig, DbType } from "../config";
import { IndexedDb } from "./indexedDb";
import type { QdChapterInfo } from "../types";

export interface Db {
    init(): Promise<void>;
    saveQdChapter(info: QdChapterInfo): Promise<void>;
    close(): void;
}

export async function createDb(): Promise<Db> {
    const config = new DbConfig();
    await config.init();
    switch (config.DbType) {
        case DbType.IndexedDb:
            const db = new IndexedDb(config.IndexedDb);
            return db;
        default:
            throw new Error('Unsupported database type');
    }
}
