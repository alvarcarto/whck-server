const BPromise = require('bluebird');
const logger = require('./util/logger')(__filename);
const createServer = require('./server');
const config = require('./config');

BPromise.config({
  warnings: config.NODE_ENV !== 'production',
  longStackTraces: true,
});

const server = createServer();
server.listen(config.PORT, () => {
  console.log('Listening on %d', server.address().port);
});

function closeServer(signal) {
  logger.info(`${signal} received`);
  logger.info('Closing http.Server ..');
  server.close();
}

// Handle signals gracefully. Heroku will send SIGTERM before idle.
process.on('SIGTERM', closeServer.bind(this, 'SIGTERM'));
process.on('SIGINT', closeServer.bind(this, 'SIGINT(Ctrl-C)'));

server.on('close', () => {
  logger.info('Server closed');
  process.emit('cleanup');

  logger.info('Giving 100ms time to cleanup..');
  // Give a small time frame to clean up
  setTimeout(process.exit, 100);
});
