import { FloatButton, Affix, Button, Space, Select, Input } from "antd";
import { SaveTwoTone, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { DbConfig, DbType, IndexedDbConfig } from "../config";
import AlertWarn from "../components/AlertWarn";
import SwitchLabel from "../components/SwitchLabel";

function IndexedDbSettings({config}: { config: IndexedDbConfig }) {
    const [compress, setCompress] = useState(false);
    useEffect(() => {
        setCompress(config.compress);
    }, [config]);
    function handleCompressChange(value: boolean) {
        setCompress(value);
        config.compress = value;
    }
    return (<>
        <SwitchLabel label="启用数据压缩" checked={compress} onChange={handleCompressChange} />
    </>)
}

export default function DbSettings() {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    const [config] = useState(new DbConfig());
    const [alert, setAlert] = useState<{ title?: string; content: string } | null>(null);
    const [dbType, setDbType] = useState<DbType>(DbType.IndexedDb);
    const [indexedDbConfig, setIndexedDbConfig] = useState<IndexedDbConfig>(new IndexedDbConfig({}));
    function handleConfig() {
        setDbType(config.DbType);
        setIndexedDbConfig(config.IndexedDb);
    }
    useEffect(() => {
        config.init().then(() => {
            handleConfig();
        }).catch(e => {
            setAlert({ content: "加载设置失败：" + (e instanceof Error ? e.message : "未知错误"), title: "错误" });
        });
    }, []);
    function saveSettings() {
        config.DbType = dbType;
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
        <div ref={setContainer}>
            <Affix target={() => container}>
                <Button type="primary" icon={<SaveOutlined />} onClick={saveSettings}>保存设置</Button>
                <Button onClick={resetSettings} style={{ marginLeft: 8 }} icon={<SyncOutlined />}>重置设置</Button>
            </Affix>
            <br />
            <Space orientation="vertical">
                <Select value={dbType} onChange={value => setDbType(value)} style={{ width: 200 }} options={[
                    {
                        label: "IndexedDb",
                        value: DbType.IndexedDb,
                    },
                ]} />
                {dbType === DbType.IndexedDb && <IndexedDbSettings config={indexedDbConfig} />}
            </Space>
            <FloatButton icon={<SaveTwoTone />} tooltip="保存设置" onClick={saveSettings} />
            {alert && <AlertWarn title={alert.title} content={alert.content} onClose={() => setAlert(null)} />}
        </div>
    );
}
