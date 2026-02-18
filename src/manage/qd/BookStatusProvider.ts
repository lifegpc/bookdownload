import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { QdChapterSimpleInfo } from "../../types";
import { Db } from "../../db/interfaces";

export type BookStatus = {
    showSavedOnly: boolean;
    chapterLists?: QdChapterSimpleInfo[];
}

export function createBookStatus(): BookStatus {
    return {
        showSavedOnly: false,
    }
}

export async function loadChapterLists(bookId: number, setBookStatus: Dispatch<SetStateAction<BookStatus>>, db: Db) {
    const list = await db.getChapterSimpleInfos(bookId);
    setBookStatus((status) => ({ ...status, chapterLists: list }));
}

export async function loadChapterListsIfNeeded(bookId: number, bookStatus: BookStatus, setBookStatus: Dispatch<SetStateAction<BookStatus>>, db: Db) {
    if (!bookStatus.chapterLists) {
        await loadChapterLists(bookId, setBookStatus, db);
    }
}

export const BookStatusContext = createContext<[BookStatus, Dispatch<SetStateAction<BookStatus>>]>(null as any);

export function useBookStatus() {
    return useContext(BookStatusContext);
}

