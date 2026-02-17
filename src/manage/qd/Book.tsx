import { Breadcrumb, Result, Button, Skeleton } from "antd";
import { NavLink, Outlet, useParams } from "react-router";
import { useDb } from "../dbProvider";
import type { QdBookInfo } from "../../types";
import { useEffect, useState } from "react";
import { BookInfoContext } from "./BookInfoProvider";
import { BookStatusContext, createBookStatus } from "./BookStatusProvider";

export default function Book() {
    const db = useDb();
    const { id } = useParams();
    const [book, setBook] = useState<QdBookInfo | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [bookStatus, setBookStatus] = useState(createBookStatus());
    async function load() {
        const data = await db.getQdBook(Number(id));
        if (data) {
            setBook(data);
        } else {
            setErr("书籍不存在");
        }
    }
    function handle() {
        load().catch(e => {
            setErr(e instanceof Error ? e.message : String(e));
        });
    }
    useEffect(() => {
        handle();
    }, [id]);
    return (
        <>
            <Breadcrumb items={
                [{
                    title: <NavLink to="/">主页</NavLink>
                }, {
                    title: '起点'
                }, {
                    title: <NavLink to="/qd/books">按书籍管理</NavLink>
                }, {
                    title: book ? `书籍详情：${book.bookName}` : '书籍详情'
                }]
            } />
            {!book && !err && <Skeleton active />}
            {err && <Result
                status="error"
                title="数据加载失败"
                subTitle={err}
                extra={<Button type="primary" onClick={() => { setErr(null); handle(); }}>重试</Button>} />}
            {book && (<BookInfoContext.Provider value={book}>
                <BookStatusContext.Provider value={[bookStatus, setBookStatus]}>
                    <Outlet />
                </BookStatusContext.Provider>
            </BookInfoContext.Provider>)}
        </>
    );
}
