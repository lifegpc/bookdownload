import { FloatButton, Affix, Button, Space, Select, Input, Typography, Alert, InputNumber } from "antd";
import { SaveTwoTone, SaveOutlined, SyncOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { DbConfig, DbType, IndexedDbConfig, PocketBaseConfig } from "../config";
import AlertWarn from "../components/AlertWarn";
import SwitchLabel from "../components/SwitchLabel";
import PocketBase from "pocketbase";

const { Text } = Typography;

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

async function testPocketBaseConnection(config: PocketBaseConfig) {
    const client = new PocketBase(config.url);
    const _authData = await client.collection('_superusers').authWithPassword(config.username, config.password);
    return client.authStore.isValid;
}

function PocketBaseSettings({config}: { config: PocketBaseConfig }) {
    const [url, setUrl] = useState('http://localhost:8090');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [prefix, setPrefix] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);
    const [batch, setBatch] = useState(false);
    const [batchSize, setBatchSize] = useState(50);
    useEffect(() => {
        setUrl(config.url);
        setUsername(config.username);
        setPassword(config.password);
        setPrefix(config.prefix);
        setBatch(config.batch);
        setBatchSize(config.batchSize);
    }, [config]);
    async function handleTestConnection() {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testPocketBaseConnection(config);
            setTestResult(result ? "连接成功！" : "连接失败！");
        } catch (e) {
            setTestResult(e instanceof Error ? e.message : "未知错误");
        } finally {
            setTesting(false);
        }
    }
    function handleUrlChange(value: string) {
        setUrl(value);
        config.url = value;
    }
    function handleUsernameChange(value: string) {
        setUsername(value);
        config.username = value;
    }
    function handlePasswordChange(value: string) {
        setPassword(value);
        config.password = value;
    }
    function handlePrefixChange(value: string) {
        setPrefix(value);
        config.prefix = value;
    }
    function handleBatchChange(value: boolean) {
        setBatch(value);
        config.batch = value;
    }
    function handleBatchSizeChange(value: number) {
        setBatchSize(value);
        config.batchSize = value;
    }
    return (<Space orientation="vertical">
        <Text>服务器地址</Text>
        <Input placeholder="服务器地址" value={url} onChange={e => handleUrlChange(e.target.value)} allowClear />
        <Alert title="用户帐户需要是超级用户(superuser)才能正常工作" type="info" />
        <Text>用户名</Text>
        <Input placeholder="用户名" value={username} onChange={e => handleUsernameChange(e.target.value)} allowClear />
        <Text>密码</Text>
        <Input.Password placeholder="密码" value={password} onChange={e => handlePasswordChange(e.target.value)} allowClear />
        <Text>前缀（可选）</Text>
        <Input placeholder="前缀（可选）" value={prefix} onChange={e => handlePrefixChange(e.target.value)} allowClear />
        <Button onClick={handleTestConnection} disabled={testing}>{testing ? "测试中..." : "测试连接"}</Button>
        <Alert title="部分批处理功能需要在服务器打开Batch API后才能使用" type="info" />
        <SwitchLabel label="启用批处理" checked={batch} onChange={handleBatchChange} />
        <Text>批处理大小</Text>
        <InputNumber min={1} value={batchSize} onChange={value => handleBatchSizeChange(value ?? 50)} />
        {testResult && <div>{testResult}</div>}
    </Space>)
}

export default function DbSettings() {
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
        <div>
            <Affix offsetTop={10}>
                <Button type="primary" icon={<SaveOutlined />} onClick={saveSettings}>保存设置</Button>
                <Button onClick={resetSettings} style={{ marginLeft: 8 }} icon={<SyncOutlined />}>重置设置</Button>
            </Affix>
            <br />
            <Space orientation="vertical">
                <Text>数据库类型</Text>
                <Select value={dbType} onChange={value => setDbType(value)} style={{ width: 200 }} options={[
                    {
                        label: "IndexedDb",
                        value: DbType.IndexedDb,
                    },
                    {
                        label: "PocketBase",
                        value: DbType.PocketBase,
                    },
                ]} />
                {dbType === DbType.IndexedDb && <IndexedDbSettings config={indexedDbConfig} />}
                {dbType === DbType.PocketBase && <PocketBaseSettings config={config.PocketBase} />}
            </Space>
            <FloatButton icon={<SaveTwoTone />} tooltip="保存设置" onClick={saveSettings} />
            {alert && <AlertWarn title={alert.title} content={alert.content} onClose={() => setAlert(null)} />}
        </div>
    );
}
