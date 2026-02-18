import { createContext, useContext } from "react";
import type { QdBookInfo } from "../../types";

export const BookInfoContext = createContext<QdBookInfo>(null as unknown as QdBookInfo);

export function useBookInfo() {
    return useContext(BookInfoContext);
}
