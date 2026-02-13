import React from 'react';
import { Descriptions, Card, Typography, Tag, Space, Button } from 'antd';
import type { BookInfo, ChapterInfo } from '../qdtypes';
import { get_chapter_content, saveAsFile } from '../utils';

const { Title, Text, Paragraph } = Typography;

interface QdChapterInfoProps {
    bookInfo: BookInfo;
    chapterInfo: ChapterInfo;
}

export default function QdChapterInfo({ bookInfo, chapterInfo }: QdChapterInfoProps) {
    // 格式化更新时间
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN');
    };

    // 格式化VIP状态
    const getVipStatusTag = (vipStatus: number) => {
        return vipStatus === 1 ? (
            <Tag color="gold">VIP章节</Tag>
        ) : (
            <Tag color="green">免费章节</Tag>
        );
    };

    // 格式化书籍状态
    const getBookStatusTag = (status: string) => {
        const statusMap: Record<string, string> = {
            '连载': 'processing',
            '完本': 'success',
        };
        return <Tag color={statusMap[status] || 'default'}>{status}</Tag>;
    };

    const chapters = get_chapter_content(chapterInfo.content);

    function saveAsTxt() {
        const chapterName = chapterInfo.chapterName.replace(/[\/\\?%*:|"<>]/g, '_');
        const bookName = bookInfo.bookName.replace(/[\/\\?%*:|"<>]/g, '_');
        const filename = `${bookName} - ${chapterName}.txt`;
        const content = `章节名: ${chapterInfo.chapterName}\n更新时间：${chapterInfo.updateTime}\n字数: ${chapterInfo.wordsCount.toLocaleString()} 字\n\n` + chapters.join('\n');
        saveAsFile(filename, content);
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 章节信息 */}
            <Card title="章节信息" size="small">
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="章节名">
                        <Text strong>{chapterInfo.chapterName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="卷名">
                        {chapterInfo.extra.volumeName || '无'}
                    </Descriptions.Item>
                    <Descriptions.Item label="章节状态">
                        {getVipStatusTag(chapterInfo.vipStatus)}
                    </Descriptions.Item>
                    <Descriptions.Item label="章节ID">
                        {chapterInfo.chapterId}
                    </Descriptions.Item>
                    <Descriptions.Item label="字数">
                        {chapterInfo.wordsCount.toLocaleString()} 字
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {chapterInfo.updateTime}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* 操作区域*/}
            <Card title="操作" size="small">
                <Button type="primary" onClick={saveAsTxt}>保存为文本文件</Button>
            </Card>

            {/* 章节导航信息 */}
            {/*(chapterInfo.extra.prevName || chapterInfo.extra.nextName) && (
                <Card title="章节导航" size="small">
                    <Descriptions column={1} size="small">
                        {chapterInfo.extra.prevName && (
                            <Descriptions.Item label="上一章">
                                <Text type="secondary">{chapterInfo.extra.prevName}</Text>
                            </Descriptions.Item>
                        )}
                        {chapterInfo.extra.nextName && (
                            <Descriptions.Item label="下一章">
                                <Text type="secondary">{chapterInfo.extra.nextName}</Text>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>
            )*/}

            {/* 书籍基本信息 */}
            <Card title="书籍信息" size="small">
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="书名">
                        <Text strong>{bookInfo.bookName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="作者">
                        {bookInfo.authorName}
                    </Descriptions.Item>
                    <Descriptions.Item label="分类">
                        {bookInfo.subCateName}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        {getBookStatusTag(bookInfo.bookStatus)}
                    </Descriptions.Item>
                    {bookInfo.wordsCnt && (
                        <Descriptions.Item label="字数">
                            {bookInfo.wordsCnt.toLocaleString()} 字
                        </Descriptions.Item>)}
                    <Descriptions.Item label="收藏">
                        {bookInfo.collect.toLocaleString()}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* 作者的话 */}
            {chapterInfo.authorSay && (
                <Card title="作者的话" size="small">
                    <Text>{chapterInfo.authorSay}</Text>
                </Card>
            )}
            {/* 章节内容 */}
            <Card title="章节内容" size="small">
                {chapters.map((paragraph, index) => (
                    <Paragraph key={index}>{paragraph}</Paragraph>
                ))}
            </Card>
        </Space>
    );
}
