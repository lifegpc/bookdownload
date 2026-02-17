import { Affix, Flex, Space, Tag, Typography, Switch } from "antd";
import { useBookInfo } from "./BookInfoProvider";
import styles from './BookIndex.module.css';
import { useBookStatus } from "./BookStatusProvider";
import VolumesList from "./VolumesList";

const { Paragraph, Link } = Typography;

const QD_BOOK_TAG_COLOR = ['blue', 'cyan', 'orange'];

export default function BookIndex() {
    const bookInfo = useBookInfo();
    const [bookStatus, setBookStatus] = useBookStatus();
    function setShowSavedOnly(showSavedOnly: boolean) {
        setBookStatus({ ...bookStatus, showSavedOnly });
    }
    return (
        <div className={styles.c}>
            <Flex justify="center" align="center">
                <img className={styles.img} src={bookInfo.bookInfo.imgUrl} />
                <Space orientation="vertical" className={styles.info}>
                    <h2 className={styles.name}>{bookInfo.bookName}</h2>
                    <Paragraph className={styles.author}><span>{bookInfo.bookInfo.pageJson.authorInfo.authorName}</span> 著</Paragraph>
                    <Flex wrap justify="flex-end" gap={8} className={styles.tags}>
                        {bookInfo.tags.map((tag) => (
                            <Tag color={QD_BOOK_TAG_COLOR[tag.type]} key={tag.name} variant="outlined">{
                                tag.url ? <Link href={tag.url} target="_blank">{tag.name}</Link> : tag.name
                            }</Tag>
                        ))}
                    </Flex>
                    <Flex justify="flex-end">
                        <Tag className={styles.sign} color="green" variant="outlined">{bookInfo.bookInfo.pageJson.signStatus}</Tag>
                    </Flex>
                    <Paragraph className={styles.intro}>{bookInfo.intro.split('\n').map((line, index) => (
                        <>{line}<br /></>
                    ))}</Paragraph>
                </Space>
            </Flex>
            <Affix offsetTop={10}>
                <Flex justify="flex-end" className={styles.affix}>
                    <Switch checked={bookStatus.showSavedOnly} onChange={setShowSavedOnly} checkedChildren={"仅显示已保存章节"} unCheckedChildren={"显示所有章节"} />
                </Flex>
            </Affix>
            {!bookStatus.showSavedOnly && <VolumesList bookId={bookInfo.id} volumes={bookInfo.volumes} />}
        </div>
    );
}
