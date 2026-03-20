const { createLogger, format, transports, addColors } = require('winston');
const { combine, timestamp, colorize, printf, errors, json } = format;

const isProduction = process.env.NODE_ENV === 'production';

// Add 'http' level between info and debug
const customLevels = {
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
  colors: { error: 'red', warn: 'yellow', info: 'green', http: 'cyan', debug: 'blue' },
};
addColors(customLevels.colors);

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `  ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}${stack ? `\n${stack}` : ''}`;
  })
);

// Structured JSON format for production (easy ingestion by log aggregators)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  levels: customLevels.levels,
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? prodFormat : devFormat,
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
