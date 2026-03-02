import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import type { Message, SendMessage } from './types';
import QdBook from "./download/qd/Book";
import { Result } from 'antd';

function Download() {
    const [message, setMessage] = useState<SendMessage | null>(null);
    useEffect(() => {
        chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            const m = message as SendMessage;
            if (m.type === 'DownloadQdBookAsEpub') {
                setMessage(m);
                sendResponse({
                    ok: true,
                    code: 0,
                    for: m.type,
                } as Message);
            }
        });
    }, []);
    return (<>
        {message && message.type === 'DownloadQdBookAsEpub' &&
            <QdBook info={message.info} options={message.options} save_type='epub' />
        }
        {!message && <Result
            title="等待下载指令..."
            status="info"
        />}
    </>)
}

createRoot(document.getElementById("root")!).render(<Download />);
