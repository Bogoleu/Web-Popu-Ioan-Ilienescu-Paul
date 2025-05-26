const http = require("http");
const url = require("url");

const { runMiddlewares } = require("./middleware");
const sendJson = require("./sendJson");
const { Router } = require("./router");

class Server {
  constructor() {
    this.router = new Router();
    this.middlewares = [];
  }

  registerRoute(method, path, handler) {
    this.router.register(method, path, handler);
  }

  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function");
    }
    this.middlewares.push(middleware);
  }

  start(port = 3000) {
    const server = http.createServer(async (req, res) => {
      const { pathname } = url.parse(req.url);

      try {
        await runMiddlewares(req, res, this.middlewares);

        const route = this.router.match(req.method, pathname);
        if (!route) return sendJson(res, 404, { error: "Not found" });

        req.params = route.params || {};
        await route.handler(req, res);
      } catch (err) {
        console.error("Error:", err);
        sendJson(res, 500, { error: "Internal Server Error" });
      }
    });

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}

module.exports = { Server };
