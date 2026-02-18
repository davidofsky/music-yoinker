import { Log } from "@/lib/logger";
import { useEffect, useState } from "react";

export function useLog(): Log[] {
    const [logs, setLogs] = useState<Log[]>([]);
    const fetchLogs = async () => {
        try {
            const res = await fetch("/api/logs");
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error(`Failed to fetch logs: ${error}`);
        }
    };

    useEffect(() => {
        fetchLogs();

        const es = new EventSource("/api/stream?topic=log");

        es.onopen = () => {
            console.info("Connected to log stream");
        };

        es.onmessage = (e) => {
            if (!e.data) return;
            try {
                const newLog: Log = JSON.parse(e.data);
                if (newLog.level && newLog.timestamp) {
                    setLogs(prev => [...prev, newLog]);
                }
            } catch (error) {
                console.error("Failed to parse log message:", error);
            }
        };

        es.onerror = (error) => {
            console.error("SSE connection error:", error);
            es.close();
        };


        return () => es.close();
    }, []);
    return logs
}