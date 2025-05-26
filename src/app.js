const { Server } = require("./core/server");
const parseJsonBody = require("./core/middlewares/parseBody");
const sendJson = require("./core/sendJson");

const authModule = require("./modules/auth/auth.routes");

const server = new Server();
server.use(parseJsonBody);

// Dependency injection for modules
authModule(server);

// some example routes
// server.registerRoute("GET", "/hello", (req, res) => {
//   sendJson(res, 200, { message: "Hello, world!" });
// });
// server.registerRoute("POST", "/echo", async (req, res) => {
//   const body = req.body;
//   sendJson(res, 200, { received: body });
// });
// server.registerRoute("GET", "/users/:id/test1/:test1", (req, res) => {
//   sendJson(res, 200, { userId: req.params.id, test1: req.params.test1 });
// });

server.start(3000);
