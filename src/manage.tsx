import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Db, createDb } from "./db/interfaces";
import Home from "./manage/Home";
import QdBooks from "./manage/qd/Books";
import { Result } from 'antd';
import { DbContext } from "./manage/dbProvider";
import QdBook from "./manage/qd/Book";

const router = createHashRouter([
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/qd/books",
        element: <QdBooks />,
    },
    {
        path: "/qd/book/:id",
        element: <QdBook />,
    }
]);

async function connectDb() {
    const db = await createDb();
    await db.init();
    return db;
}

function Manage() {
    const [db, setDb] = useState<Db | null>(null);
    const [err, setErr] = useState<string | null>(null);
    useEffect(() => {
        connectDb().then(setDb).catch(e => {
            setErr(e instanceof Error ? e.message : String(e));
        });
    }, []);
    if (err) {
        return <Result
            status="error"
            title="数据库连接失败"
            subTitle={err}
        />
    }
    if (!db) {
        return <Result
            status="info"
            title="数据库连接中"
        />
    }
    return <DbContext.Provider value={db}>
        <RouterProvider router={router} />
    </DbContext.Provider>
}

createRoot(document.getElementById("root")!).render(<Manage />);
