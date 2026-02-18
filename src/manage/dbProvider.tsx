import { createContext, useContext } from "react";
import type { Db } from "../db/interfaces";

export const DbContext = createContext<Db>(null as unknown as Db);

export function useDb() {
    return useContext(DbContext);
}
