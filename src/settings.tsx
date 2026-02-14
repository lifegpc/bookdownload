import { createRoot } from "react-dom/client";
import { Typography, Tabs } from "antd";
import type { TabsProps } from 'antd';
import QdSettings from "./settings/QdSettings";
import DbSettings from "./settings/DbSettings";

const { Title } = Typography;

const items: TabsProps['items'] = [
    {
        'key': '1',
        'label': `数据库设置`,
        'children': <DbSettings />,
    },
    {
        'key': '2',
        'label': `起点设置`,
        'children': <QdSettings />,
    },
];

function Settings() {
    return (<>
        <Title >扩展设置</Title>
        <Tabs defaultActiveKey="1" items={items} />
    </>);
}

createRoot(document.getElementById("root")!).render(<Settings />);
