import { FloatButton, Affix, Button, Space } from "antd";
import { SaveTwoTone, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { QdConfig } from "../config";
import SwitchLabel from "../components/SwitchLabel";
import AlertWarn from "../components/AlertWarn";

export default function QdSettings() {
    const [config] = useState(new QdConfig());
    const [autoSaveChapter, setAutoSaveChapter] = useState(false);
    const [alert, setAlert] = useState<{ title?: string; content: string } | null>(null);
    function handleConfig() {
        setAutoSaveChapter(config.AutoSaveChapter);
    }
    useEffect(() => {
        config.init().then(() => {
            handleConfig();
        }).catch(e => {
            setAlert({ content: "加载设置失败：" + (e instanceof Error ? e.message : "未知错误"), title: "错误" });
        });
    }, []);
    function saveSettings() {
        config.AutoSaveChapter = autoSaveChapter;
        config.save().then(() => {
            setAlert({ content: "设置已保存！", title: "通知" });
        }).catch(e => {
            setAlert({ content: e instanceof Error ? e.message : "未知错误", title: "错误" });
        });
    }
    function resetSettings() {
        config.reset();
        handleConfig();
    }
    return (
        <div>
            <Affix offsetTop={10}>
                <Button type="primary" icon={<SaveOutlined />} onClick={saveSettings}>保存设置</Button>
                <Button onClick={resetSettings} style={{ marginLeft: 8 }} icon={<SyncOutlined />}>重置设置</Button>
            </Affix>
            <br />
            <Space orientation="vertical">
                <SwitchLabel label="自动保存章节" checked={autoSaveChapter} onChange={setAutoSaveChapter} />
            </Space>
            <FloatButton icon={<SaveTwoTone />} tooltip="保存设置" onClick={saveSettings} />
            {alert && <AlertWarn title={alert.title} content={alert.content} onClose={() => setAlert(null)} />}
        </div>
    );
}
