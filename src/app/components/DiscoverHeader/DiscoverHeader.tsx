"use client"
import { Flex, Layout, Segmented, Typography, theme } from "antd"
import { FaLastfm } from "react-icons/fa"
import Logo from "../Logo/Logo"
import type { DiscoverPeriod } from "@/lib/discovery"

const { Text } = Typography

const PERIODS: { label: string; value: DiscoverPeriod }[] = [
  { label: 'Week', value: '7day' },
  { label: 'Month', value: '1month' },
  { label: '3 months', value: '3month' },
]

type Props = {
  // Controls only show once someone is connected.
  username: string | null | undefined
  period: DiscoverPeriod
  onPeriodChange: (period: DiscoverPeriod) => void
}

const DiscoverHeader = ({ username, period, onPeriodChange }: Props) => {
  const { token } = theme.useToken()
  return (
    <Layout.Header style={{ height: 'auto', lineHeight: 'normal', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
      <Flex vertical align="center" gap="middle" style={{ padding: '24px 0' }}>
        <Logo />
        {username && (
          <Flex wrap align="center" justify="center" gap="middle">
            <Flex align="center" gap={6} style={{ whiteSpace: 'nowrap' }}>
              <FaLastfm color={token.colorTextSecondary} />
              <Text type="secondary">{username}</Text>
            </Flex>
            <Segmented value={period} onChange={v => onPeriodChange(v as DiscoverPeriod)} options={PERIODS} />
          </Flex>
        )}
      </Flex>
    </Layout.Header>
  )
}

export default DiscoverHeader
