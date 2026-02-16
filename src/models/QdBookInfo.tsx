import { Space, Card, Col, Row, Image, Descriptions, Collapse, Typography, Button } from 'antd';
import type { QdBookInfo } from '../types';
import { createDb } from '../db/interfaces';

interface QdBookInfoProps {
    info: QdBookInfo;
}

const { Text } = Typography;

export default function QdBookInfo({ info }: QdBookInfoProps) {
    async function saveToDb() {
        const db = await createDb();
        await db.init();
        await db.saveQdBook(info);
        db.close();
    }
    return (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Card title="书籍信息" size="small">
                <Row>
                    <Col span={6}>
                        <Image src={info.bookInfo.imgUrl} />
                    </Col>
                    <Col span={18}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="书名">
                                {info.bookName}
                            </Descriptions.Item>
                            <Descriptions.Item label="书籍ID">
                                {info.id}
                            </Descriptions.Item>
                            <Descriptions.Item label="标签">
                                {info.tags.map(tag => tag.name).join(', ')}
                            </Descriptions.Item>
                            <Descriptions.Item label="简介">
                                {info.intro.split('\n').map((line, index) => (
                                    <>{line}<br /></>
                                ))}
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>
            </Card>
            <Card title="操作" size="small">
                <Button type="primary" onClick={saveToDb}>保存到数据库</Button>
            </Card>
            <Card title="卷信息" size="small">
                <Collapse items={
                    info.volumes.map(volume => ({
                        key: volume.id,
                        label: volume.name,
                        extra: volume.isVip ? <span style={{ color: 'red' }}>VIP卷</span> : null,
                        children: (<Space size="small" orientation="vertical">
                            {volume.chapters.map(chapter => (
                                <Text key={chapter.id} onClick={() => {
                                    const url = `https://www.qidian.com/chapter/${info.id}/${chapter.id}`;
                                    chrome.tabs.create({ url });
                                }} style={{ cursor: 'pointer' }}>{chapter.name}</Text>
                            ))}
                        </Space>)
                    }))
                } />
            </Card>
        </Space>
    )
}
