import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const logsPath = path.join(process.cwd(), 'logs', 'combined.log');
    const logs = fs.readFileSync(logsPath, 'utf8');
    const logLines = logs.split('\n').filter(line => line.trim() !== '');

    // Parse JSON logs (if structured)
    const parsedLogs = logLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { message: line, timestamp: new Date().toISOString() };
      }
    });

    return NextResponse.json(parsedLogs, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}

