function parseJsonBody(req, res, next) {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) return next();

  if (req.headers["content-type"] !== "application/json") {
    return next(new Error("Content-Type must be application/json"));
  }
  
  let data = "";
  req.on("data", (chunk) => (data += chunk));
  req.on("end", () => {
    try {
      console.log("data", data);
      req.body = data ? JSON.parse(data) : {};
      next();
    } catch {
      next(new Error("Invalid JSON"));
    }
  });
}

module.exports = parseJsonBody;
