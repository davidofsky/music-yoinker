"use client";
import { useEffect, useRef, useState } from "react";
import { FaCircleInfo, FaCircleExclamation, FaXmark, FaTriangleExclamation } from "react-icons/fa6";
import { Log } from "@/lib/logger";
import "./LogList.css"
import { useLog } from "@/app/hooks/useLog";

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
      <>
        <div className="LogList" ref={listRef}>
            {logs.map((log, index) => (
                <div key={index} className={`LogItem ${log.level}`}>
                    <div className="LogIcon">{getLogIcon(log.level)}</div>

                    <div className="LogContent">
                        <div className="LogHeader">
                            <span className="LogLevel">{log.level}</span>
                            <span className="LogTime">
                                {new Date(log.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <p className="LogMessage">{log.message}</p>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
        <button className={`StickyButton ${sticky ? 'Enabled' : 'Disabled'}`}
          onClick={() => {setSticky(!sticky)}}>
          Stick to bottom {sticky? "(enabled)" : "(disabled)"}
        </button>
      </>
    );
}

