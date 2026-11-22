"use client"
import Link from "next/link";
import { Flex, Typography, theme } from "antd";
import { FaArrowRight, FaCompass } from "react-icons/fa";
import { useLastFm } from "@/app/hooks/useLastFm";

const { Title, Text } = Typography;

// On the empty homepage, when Last.fm is configured.
const DiscoverBanner = () => {
  const { token } = theme.useToken();
  const lastFm = useLastFm();
  if (!lastFm?.enabled) return null;

  return (
    <Link href="/discover" style={{ width: '100%', maxWidth: 270 }}>
      <Flex
        align="center"
        gap="large"
        style={{
          padding: '24px 28px',
          borderRadius: 16,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <FaCompass size={44} color="#fff" style={{ flexShrink: 0 }} />
        <Flex vertical style={{ flex: 1, minWidth: 0 }}>
          <Title level={3} style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-bbh-bogle)' }}>Discover</Title>
        </Flex>
        <FaArrowRight size={20} color="#fff" style={{ flexShrink: 0 }} />
      </Flex>
    </Link>
  );
};

export default DiscoverBanner;