import { Breadcrumb, Button, Card, Divider, Space } from 'antd';
import { useNavigate } from 'react-router';

export default function Home() {
    const navigate = useNavigate();
    return (
        <>
            <Breadcrumb items={
                [{
                    title: '主页'
                }]
            } />
            <Divider />
            <Space orientation="vertical" size="large">
                <Card title="起点">
                    <Button type="primary" onClick={() => navigate("/qd/books")}>按书籍管理</Button>
                </Card>
            </Space>
        </>
    )
}
