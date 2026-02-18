import { createContext, useContext, Dispatch, SetStateAction } from "react";
import { QdChapterSimpleInfo } from "../../types";
import { Db } from "../../db/interfaces";
import { useOutletContext } from "react-router";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";

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
    const list = await db.getQdChapterSimpleInfos(bookId);
    setBookStatus((status) => ({ ...status, chapterLists: list }));
}

export async function loadChapterListsIfNeeded(bookId: number, bookStatus: BookStatus, setBookStatus: Dispatch<SetStateAction<BookStatus>>, db: Db) {
    if (!bookStatus.chapterLists) {
        await loadChapterLists(bookId, setBookStatus, db);
    }
}

export const BookStatusContext = createContext<[BookStatus, Dispatch<SetStateAction<BookStatus>>]>(null as unknown as [BookStatus, Dispatch<SetStateAction<BookStatus>>]);

export function useBookStatus() {
    return useContext(BookStatusContext);
}

export function useBookContext() {
    return useOutletContext<Dispatch<ItemType[]>>();
}

