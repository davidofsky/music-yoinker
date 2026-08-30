"use client";
import { useEffect, useRef, useState } from "react";
import { FaCircleInfo, FaCircleExclamation, FaXmark, FaTriangleExclamation } from "react-icons/fa6";
import { Button, Card, Flex, Tag, Typography } from "antd";
import "./LogList.css"
import { useLog } from "@/app/hooks/useLog";

const { Text } = Typography;

const LEVEL_COLOR: Record<string, string> = {
    error: "red",
    warn: "gold",
    info: "blue",
    debug: "default",
};

const getLogIcon = (level: string) => {
    switch (level) {
        case "error":
            return <FaXmark />;
        case "warn":
            return <FaTriangleExclamation />;
        case "info":
            return <FaCircleInfo />;
        default:
            return <FaCircleExclamation />;
    }
};

export function LogList() {
    const listRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [sticky, setSticky] = useState(true);
    const logs = useLog();

    useEffect(() => {
        if (sticky) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, sticky]);

    return (
      <Flex vertical align="center" gap="middle" style={{ width: '100%', maxWidth: '50em' }}>
        <Flex vertical gap="small" ref={listRef} style={{ width: '100%', maxHeight: '75vh', overflowY: 'auto' }}>
            {logs.map((log, index) => (
                <Card key={index} size="small" className="LogItem">
                    <Flex align="center" gap="small">
                        {getLogIcon(log.level)}
                        <Flex vertical style={{ flex: 1 }}>
                            <Flex align="center" gap="small">
                                <Tag color={LEVEL_COLOR[log.level] ?? "default"}>{log.level}</Tag>
                                <Text type="secondary" style={{ fontSize: '80%' }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </Text>
                            </Flex>
                            <Text>{log.message}</Text>
                        </Flex>
                    </Flex>
                </Card>
            ))}
            <div ref={bottomRef} />
        </Flex>
        <Button
          type={sticky ? "primary" : "default"}
          style={{ alignSelf: 'flex-end' }}
          onClick={() => setSticky(!sticky)}>
          Stick to bottom {sticky ? "(enabled)" : "(disabled)"}
        </Button>
      </Flex>
    );
}
