import { Typography, Switch, FloatButton, Affix, Button } from "antd";
import { SaveTwoTone, SaveOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

export default function QdSettings() {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    return (
        <div ref={setContainer}>
            <Title level={2}>起点设置</Title>
            <Affix target={() => container}>
                <Button type="primary" icon={<SaveOutlined />}>保存设置</Button>
            </Affix>
            <FloatButton icon={<SaveTwoTone />} tooltip="保存设置" />
        </div>
    );
}
