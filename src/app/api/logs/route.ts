import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { LogDirectory } from '@/lib/logger';

export async function GET() {
  try {
    const logsPath = path.join(LogDirectory, 'combined.ndjson');
    const logs = fs.readFileSync(logsPath, 'utf8');
    const logLines = logs.split('\n').filter(line => line.trim() !== '');

    // Parse JSON logs (if structured)
    const parsedLogs = logLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error("An error occured while trying to parse logs", e)
        return { message: line, timestamp: new Date().toISOString() };
      }
    });

    return NextResponse.json(parsedLogs, { status: 200 });
  } catch (e) {
    console.error("An error occured while trying to retieve logs", e)
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 });
  }
}
