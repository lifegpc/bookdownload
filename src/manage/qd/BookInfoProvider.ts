import { createContext, useContext } from "react";
import type { QdBookInfo } from "../../types";

export const BookInfoContext = createContext<QdBookInfo>(null as any);

export function useBookInfo() {
    return useContext(BookInfoContext);
}
