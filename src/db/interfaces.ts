import { DbConfig, DbType } from "../config";
import { IndexedDb } from "./indexedDb";
import { PocketBaseDb } from "./pocketBase";
import type { QdChapterInfo, QdBookInfo, PagedData, QdChapterSimpleInfo } from "../types";

export interface Db {
    init(): Promise<void>;
    /**
     * Save chapter info to database.
     * @param info Chapter info to save. if id, bookId and hash are matched in the database, skip saving.
     */
    saveQdChapter(info: QdChapterInfo): Promise<void>;
    /**
     * Save book info to database.
     * @param info Book info to save. if id is matched in the database, update the existing record.
     */
    saveQdBook(info: QdBookInfo): Promise<void>;
    getQdBook(id: number): Promise<QdBookInfo | undefined>;
    getQdBooks(page: number, pageSize: number): Promise<PagedData<QdBookInfo>>;
    /**
     * Retrieve chapter list of a book. if bookId is not found, return empty array.
     * Primary key should be the latest (time is biggest) saved chapter.
     * @param bookId Book ID
     */
    getChapterSimpleInfos(bookId: number): Promise<QdChapterSimpleInfo[]>;
    close(): void;
}

export async function createDb(): Promise<Db> {
    const config = new DbConfig();
    await config.init();
    switch (config.DbType) {
        case DbType.IndexedDb:
            return new IndexedDb(config.IndexedDb);
        case DbType.PocketBase:
            return new PocketBaseDb(config.PocketBase);
        default:
            throw new Error('Unsupported database type');
    }
}
