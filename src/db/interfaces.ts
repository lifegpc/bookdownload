import { DbConfig, DbType } from "../config";
import { IndexedDb } from "./indexedDb";
import { PocketBaseDb } from "./pocketBase";
import type { QdChapterInfo } from "../types";

export interface Db {
    init(): Promise<void>;
    /**
     * Save chapter info to database.
     * @param info Chapter info to save. if id, bookId and hash are matched in the database, skip saving.
     */
    saveQdChapter(info: QdChapterInfo): Promise<void>;
    close(): void;
}

export async function createDb(): Promise<Db> {
    const config = new DbConfig();
    await config.init();
    switch (config.DbType) {
        case DbType.IndexedDb:
            const db1 = new IndexedDb(config.IndexedDb);
            return db1;
        case DbType.PocketBase:
            const db2 = new PocketBaseDb(config.PocketBase);
            return db2;
        default:
            throw new Error('Unsupported database type');
    }
}
