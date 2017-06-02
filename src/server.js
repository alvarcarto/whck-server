const BPromise = require('bluebird');
const fs = BPromise.promisifyAll(require('fs'));
const path = require('path');
const _ = require('lodash');
const uuidV4 = require('uuid/v4');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');

const upload = multer({
  dest: './uploads',
  limits: {
    fileSize: 1024 * 1024 * 30,
  },
});

let events = [];

function handleMessage(data) {
  _.each(events, (e) => {
    const searchFor = data.type === 'space'
      ? 'whack'
      : 'space';

    const fastEnough = moment().diff(e.time, 'ms') < 500;
    if (e.type === searchFor && fastEnough) {
      console.log('match found!');

      if (e.type === 'whack') {
        const sendData = { type: 'match', url: e.url };
        data.ws.send(JSON.stringify(sendData));
      } else {
        const sendData = { type: 'match', url: data.url };
        e.ws.send(JSON.stringify(sendData));
      }
    }
  });

  events.push(data);
  removeOldEvents();
}

function removeOldEvents() {
  events = _.filter(events, e => moment().diff(e.time, 'seconds') < 5);
}

function createExpressApp() {
  const app = express();
  app.use((req, res, next) => console.log('incodming request') || next());

  app.use(morgan('dev'));

  app.options('*', cors());
  const corsOpts = {
    origin: '*',
  };
  console.log('Using CORS options:', corsOpts);
  app.use(cors(corsOpts));

  app.post('/api/uploads', upload.single('image'), (req, res, next) => {
    const filePath = req.file.path;
    const ext = path.extname(path.basename(req.file.originalname));
    const newFileName = `${uuidV4()}${ext}`;

    fs.renameAsync(filePath, path.join('./uploads', newFileName))
      .then(() => {
        res.send({
          url: `/api/uploads/${newFileName}`,
        });
      })
      .catch(next);
  });
  app.use('/api/uploads', express.static('uploads'));

  return app;
}

function createServer() {
  const app = createExpressApp();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('Connection received');

    ws.on('message', (msg) => {
      console.log('RECV message:', msg)
      const data = JSON.parse(msg);
      data.time = moment();
      data.ws = ws;

      handleMessage(data);
    });
  });

  return server;
}

module.exports = createServer;
