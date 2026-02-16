import { Flex, Space, Typography } from "antd";
import { useBookInfo } from "./BookInfoProvider";
import styles from './BookIndex.module.css';

const { Paragraph } = Typography;

export default function BookIndex() {
    const bookInfo = useBookInfo();
    return (
        <div className={styles.c}>
            <Flex justify="center">
                <img className={styles.img} src={bookInfo.bookInfo.imgUrl} />
                <Space orientation="vertical" className={styles.info}>
                    <h2 className={styles.name}>{bookInfo.bookName}</h2>
                    <Paragraph className={styles.author}><span>{bookInfo.bookInfo.pageJson.authorInfo.authorName}</span> 著</Paragraph>
                </Space>
            </Flex>
        </div>
    );
}
