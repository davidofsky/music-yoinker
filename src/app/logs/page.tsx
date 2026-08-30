"use client";
import { Flex, Layout, Typography, theme } from "antd";
import { LogList } from "../components/LogList/LogList";

const { Header, Content } = Layout;
const { Title } = Typography;
const { useToken } = theme;

export default function Logs() {
    const { token } = useToken();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ height: 'auto', lineHeight: 'normal', padding: '24px 32px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <Title level={2} style={{ margin: 0 }}>Server Logs</Title>
            </Header>
            <Content style={{ padding: 32 }}>
                <Flex justify="center">
                    <LogList/>
                </Flex>
            </Content>
        </Layout>
    );
}
