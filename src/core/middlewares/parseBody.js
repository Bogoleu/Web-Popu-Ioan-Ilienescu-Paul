function parseJsonBody(req, res, next) {
  // skip body parsing for GET, DELETE, HEAD requests
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  // if no content-type header, assume no body
  if (!req.headers["content-type"]) {
    req.body = {};
    return next();
  }

  // check for json content type
  if (!req.headers["content-type"].includes("application/json")) {
    return next(new Error("Content-Type must be application/json"));
  }
  
  let data = "";
  req.on("data", (chunk) => (data += chunk));
  req.on("end", () => {
    try {
      req.body = data ? JSON.parse(data) : {};
      next();
    } catch {
      next(new Error("Invalid JSON"));
    }
  });
}

module.exports = parseJsonBody;
