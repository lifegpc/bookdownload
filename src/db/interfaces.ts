import { DbConfig, DbType } from "../config";
import { IndexedDb } from "./indexedDb";
import { PocketBaseDb } from "./pocketBase";
import type { QdChapterInfo, QdBookInfo, PagedData, QdChapterSimpleInfo, QdChapterHistoryInfo } from "../types";

export interface Db {
    init(): Promise<void>;
    /**
     * Whether the database implementation supports batch operation. If true, return batch size if batch operation is enabled, otherwise return undefined.
     */
    batchSize(): number | undefined;
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
    /**
     * Update chapter info in database.
     * @param info The chapter info to update. time will be updated to current time in database implementation so mannual update is not needed. Primary key was chapterId, bookId and time.
     * @returns Primary key of the updated chapter, which is determined by the database implementation.
     */
    updateQdChapter(info: QdChapterInfo): Promise<unknown>;
    getQdBook(id: number): Promise<QdBookInfo | undefined>;
    getQdBooks(page: number, pageSize: number): Promise<PagedData<QdBookInfo>>;
    /**
     * Retrieve chapter list of a book. if bookId is not found, return empty array.
     * Primary key should be the latest (time is biggest) saved chapter.
     * @param bookId Book ID
     */
    getQdChapterSimpleInfos(bookId: number): Promise<QdChapterSimpleInfo[]>;
    /**
     * Get chapter info by primary key. if not found, return undefined.
     * @param key Primary key of the chapter, which is determined by the database implementation.
     */
    getQdChapter(key: unknown): Promise<QdChapterInfo | undefined>;
    /**
     * See @function getQdChapter. This function is used to get multiple chapters in batch. if a chapter is not found, the corresponding position in the returned array will be undefined.
     */
    getQdChaptersBatch(keys: unknown[]): Promise<(QdChapterInfo | undefined)[]>;
    /**
     * Get chapter info by book ID, chapter ID and time. if not found, return undefined.
     * @param bookId Book ID
     * @param id Chapter ID
     * @param time Timestamp of the chapter
     * @returns Chapter info if found, otherwise undefined
     */
    getQdChapterByTime(bookId: number, id: number, time: number): Promise<QdChapterInfo | undefined>;
    /**
     * Get chapter history by chapter ID. if not found, return empty array.
     * @param chapterId Chapter ID
     * @returns Chapter history, sorted by time in descending order (latest first)
     */
    getQdChapterHistory(chapterId: number): Promise<QdChapterHistoryInfo[]>;
    /**
     * Get the latest (which time is biggest) chapter of a chapter. if not found, return undefined.
     * @param id Chapter ID
     */
    getLatestQdChapter(id: number): Promise<QdChapterInfo | undefined>;
    /**
     * Set the latest chapter by primary key. This function will update the time of the chapter.
     * @param key Primary key of the chapter, which is determined by the database implementation.
     * @returns Primary key of the chapter set as latest, which is determined by the database implementation. if the chapter is not found, return undefined.
     */
    setAsLatestQdChapter(key: unknown): Promise<unknown>;
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
