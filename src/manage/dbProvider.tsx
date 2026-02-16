import { createContext, useContext } from "react";
import type { Db } from "../db/interfaces";

export const DbContext = createContext<Db>(null as any);

export function useDb() {
    return useContext(DbContext);
}
