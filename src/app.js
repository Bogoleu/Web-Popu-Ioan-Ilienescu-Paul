const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { Server } = require("./core/server");
const parseConfig = require("./utils/config");
const parseJsonBody = require("./core/middlewares/parseBody");

const authModule = require("./modules/auth/auth.routes");
const userModule = require('./modules/users/users.routes');
const dumpsterModule  = require('./modules/dumpster/dumpster.routes');
const reportModule  = require('./modules/report/report.routes');
const dashboardModule = require('./modules/dashboard/dashboard.routes');

const runReports = require('./utils/generateReport');

async function main() {
  const config = await parseConfig("./config/dev.json");
  const db = await mongoose.connect(config.database.uri, {
    tlsInsecure: true,
  });

  if (!db) {
    throw new Error("Failed to connect to the database");
  }
  console.log("Connected to MongoDB");

  const server = new Server();

  server.use((req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    let requestedFile = req.url === '/' ? 'pages/landing.html' : req.url;
    requestedFile = path.normalize(requestedFile).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, '..', 'Frontend', requestedFile);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        next();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.use(parseJsonBody);
  server.use((req, _, next) => {
    req.config = config;
    next();
  });

  authModule(server);
  userModule(server);
  dumpsterModule(server);
  reportModule(server);
  dashboardModule(server);

  server.start(3000);
}

main();
