const mongoose = require('mongoose');

const { Server } = require("./core/server");
const parseConfig = require("./utils/config");
const parseJsonBody = require("./core/middlewares/parseBody");

const authModule = require("./modules/auth/auth.routes");
const userModule = require('./modules/users/users.routes');
const dumpsterModule  = require('./modules/dumpster/dumpster.routes');
const reportModule  = require('./modules/report/report.routes');

const runReports = require('./utils/generateReport');

async function main() {
  const config = await parseConfig("./config/dev.json");
  const db = await mongoose.connect(config.database.uri, {
    tlsInsecure: true,
  })

  if (!db) {
    throw new Error("Failed to connect to the database")
  }

  
  const server = new Server();
  server.use(parseJsonBody);
  server.use((req, _, next) => {
    req.config = config;
    next()
  })
  
  // Dependency injection for modules
  authModule(server);
  userModule(server);
  dumpsterModule(server);
  reportModule(server);

  // await runReports()
  server.start(3000);
}

// go to async all the way
main()


