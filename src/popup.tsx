import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Message } from "./types";
import { getCurrentTab, parseUrlParams, sendMessageToTab } from "./utils";
import * as styles from "./popup.module.css";
import { Spin, Result } from "antd";
import QdChapterInfo from "./models/QdChatperInfo";

function PopupBody() {
    const [result, setResult] = useState<Message | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoad, setIsLoading] = useState(false);
    useEffect(() => {
        async function load() {
            try {
                const tab = await getCurrentTab();
                if (!tab) {
                    setError('No active tab found');
                    return;
                }
                const url = tab.url;
                console.log(`Current tab URL: ${url}`);
                if (!url) {
                    setError('No active tab URL found');
                    return;
                }
                if (!tab.id) {
                    setError('No active tab ID found');
                    return;
                }
                if (tab.width && tab.width >= 750) {
                    document.documentElement.style.setProperty('--popup-width', `${tab.width}px`);
                }
                const params = parseUrlParams(url);
                if (!params) {
                    setError('不支持的页面');
                    return;
                }
                if (params.page === 'qdchapter') {
                    const msg = await sendMessageToTab(tab.id, {
                        type: 'GetQdChapterInfo',
                    });
                    setResult(msg);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Unknown error');
                return;
            }
        }
        if (isLoad) {
            return;
        }
        setIsLoading(true);
        load().catch(e => {
            setError(e instanceof Error ? e.message : 'Unknown error');
        });
    });
    if (result) {
        console.log(result);
        if (result.ok && result.body?.type === 'QdChapterInfo') {
            const { bookInfo, chapterInfo } = result.body;
            return <QdChapterInfo bookInfo={bookInfo} chapterInfo={chapterInfo} />;
        }
        return <Result status="error" title="错误" subTitle={result.msg || '未知错误'} />;
    }
    if (error) {
        return <Result status="error" title="错误" subTitle={error} />;
    }
    return <Spin className={styles.loading} size="large" description="加载中..." />;
}

function Popup() {
    return (
        <div className={styles.body}><PopupBody /></div>
    );
}

createRoot(document.getElementById("root")!).render(<Popup />);
