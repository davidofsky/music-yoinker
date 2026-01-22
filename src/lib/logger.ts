import * as winston from "winston";
import { broadcast, Topic } from "./broadcast";

export interface Log {
    level: string;
    message: string;
    timestamp: string;
}

const { combine, timestamp, colorize, printf, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : "";
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

const fileFormat = combine(
  timestamp(),
  json()
);

const logger = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
      maxsize: 1024 * 1024,
      maxFiles: 1
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
      maxsize: 1024 * 1024,
      maxFiles: 1
    }),
  ],
});


// Hook into logger to broadcast all messages
logger.on('data', (info) => {
  broadcast(
    JSON.stringify({
      level: info.level,
      message: info.message,
      timestamp: new Date().toISOString()
    }),
    Topic.log
  ).catch(err => {
    console.error('Failed to broadcast log:', err);
  });
});


declare global {
  var logger: winston.Logger;
}

if (!global.logger) {
  global.logger = logger;
}

export default global.logger;

