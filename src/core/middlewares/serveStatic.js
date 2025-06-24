const fs = require("fs");
const path = require("path");
const mime = require("mime");

function serveStatic(rootFolder) {
    return async function (req, res, next) {
        if (req.method !== "GET" && req.method !== "HEAD") {
            return next();
        }

        let filePath = decodeURIComponent(req.url.split("?")[0]);

        if (filePath === "/") {
            filePath = "/index.html";
        }

        const fullPath = path.join(rootFolder, filePath);

        try {
            const stat = await fs.promises.stat(fullPath);

            if (stat.isFile()) {
                const contentType = mime.getType(fullPath) || "application/octet-stream";
                res.writeHead(200, { "Content-Type": contentType });
                const readStream = fs.createReadStream(fullPath);
                readStream.pipe(res);
                readStream.on("error", (err) => {
                    next(err);
                });
            } else {
                next();
            }
        } catch {
            next();
        }
    };
}

module.exports = serveStatic;
