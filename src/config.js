/* eslint-disable no-process-env */

const path = require('path');

// Env vars should be casted to correct types
const config = {
  PORT: Number(process.env.PORT) || 9000,
  WS_PORT: Number(process.env.WS_PORT) || 9001,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
};

module.exports = config;
