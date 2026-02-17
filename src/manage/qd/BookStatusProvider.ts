import { createContext, useContext, Dispatch } from "react";

export type BookStatus = {
    showSavedOnly: boolean;
}

export function createBookStatus(): BookStatus {
    return {
        showSavedOnly: false,
    }
}

export const BookStatusContext = createContext<[BookStatus, Dispatch<BookStatus>]>(null as any);

export function useBookStatus() {
    return useContext(BookStatusContext);
}

