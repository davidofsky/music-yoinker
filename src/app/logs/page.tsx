"use client";
import { LogList } from "../components/LogList/LogList";
import "../globals.css";
import "./logs.css"

export default function Logs() {
    return (
        <div className="LogPage">
            <h1 className="SmallTitle">Server logs</h1>
            <LogList/>
        </div>
    );
}

