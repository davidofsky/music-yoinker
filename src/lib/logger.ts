import * as winston from "winston";
import config from "./config";
import { broadcast, Topic } from "./broadcast";

export interface Log {
    level: string;
    message: string;
    timestamp: string;
}

const { combine, timestamp, colorize, printf, json } = winston.format;

// Human-readable format
const humanFormat = printf(({ timestamp, level, message, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Console format
const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  humanFormat
);

// JSON format for combined.json
const jsonFormat = combine(
  timestamp(),
  json()
);

// Human-readable file format with timestamp
const humanFileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  humanFormat
);

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  transports: [
    // Console output (human-readable)
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // All logs in JSON
    new winston.transports.File({
      filename: "logs/combined.ndjson",
      format: jsonFormat,
      maxsize: 1024 * 1024,
      maxFiles: 1
    }),
    // All logs human-readable
    new winston.transports.File({
      filename: "logs/combined.log",
      format: humanFileFormat,
      maxsize: 1024 * 1024,
      maxFiles: 1
    }),
    // Only errors human-readable
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: humanFileFormat,
      maxsize: 1024 * 1024,
      maxFiles: 1
    }),
  ],
});


// Hook that broadcasts the logged message for any live watchers
logger.on('data', (log) => {
  broadcast(
    JSON.stringify({
      level: log.level,
      message: log.message,
      timestamp: new Date().toISOString()
    }),
    Topic.log
  ).catch((err: any) => {
    logger.error('Failed to broadcast log:', err);
  });
});


declare global {
  var logger: winston.Logger;
}

if (!global.logger) {
  global.logger = logger;
}

export default global.logger;

