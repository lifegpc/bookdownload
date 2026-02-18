import { Breadcrumb, Divider, Affix, Pagination, Skeleton, Result, Button, Card, Flex, Row, Col, Image, Typography } from 'antd';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { useDb } from '../dbProvider';
import { useEffect, useState } from 'react';
import type { PagedData, QdBookInfo } from '../../types';
import styles from './Books.module.css';

const { Paragraph } = Typography;

export default function Books() {
    const db = useDb();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(Number(searchParams.get('page') || '1'));
    const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize') || '10'));
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [pageData, setPageData] = useState<PagedData<QdBookInfo> | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();
    async function loadPage() {
        const data = await db.getQdBooks(page, pageSize);
        setPageData(data);
        setTotalCount(data.total);
    }
    function handle() {
        setPageData(null);
        loadPage().catch(e => {
            setErr(e instanceof Error ? e.message : String(e));
        });
    }
    useEffect(() => {
        handle();
    }, [page, pageSize]);
    return (
        <>
            <Breadcrumb items={
                [{
                    title: <NavLink to="/">主页</NavLink>
                }, {
                    title: '起点'
                }, {
                    title: '按书籍管理'
                }]
            } />
            <Divider />
            <div>
                {totalCount !== null && (<Affix offsetTop={10}>
                    <Pagination
                        className={styles.affix}
                        total={totalCount}
                        pageSize={pageSize}
                        pageSizeOptions={[10, 20, 50, 100]}
                        onChange={(page, pageSize) => { setPage(page); setPageSize(pageSize); setSearchParams({ page: String(page), pageSize: String(pageSize) }); }}
                        showTotal={(total, range) => `共 ${total} 条，当前显示 ${range[0]} - ${range[1]} 条`}
                        showSizeChanger
                    />
                </Affix>)}
                {!pageData && !err && <Skeleton active />}
                {err && <Result
                    status="error"
                    title="数据加载失败"
                    extra={<Button type="primary" onClick={() => { setErr(null); handle(); }}>重试</Button>} />}
                {pageData && <Flex>
                    {pageData.items.map(book => (
                        <Card key={book.id} className={styles['books-card']} onClick={() => navigate(`/qd/book/${book.id}`)}>
                            <Row>
                                <Col span={6}>
                                    <Image src={book.bookInfo.imgUrl} preview={false} />
                                </Col>
                                <Col span={18}>
                                    <h3 className={styles.name}>{book.bookName}</h3>
                                    <Paragraph className={styles.author}>{book.bookInfo.pageJson.authorInfo.authorName} 著</Paragraph>
                                    <Paragraph className={styles.intro} ellipsis={{rows: 3}}>{book.intro}</Paragraph>
                                </Col>
                            </Row>
                        </Card>
                    ))}
                </Flex>}
            </div>
        </>
    )
}
