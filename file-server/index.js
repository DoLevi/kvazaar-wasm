const http = require("http");
const path = require("path");
const fs = require("fs");


const PORT = 80;
const homeDir = process.env.HOME_DIR;
const mainPath = "/index.html";

const getContentType = (requestedPath) => {
    switch (path.extname(requestedPath)) {
        case ".js":
            return "text/javascript";
        case ".wasm":
            return "application/wasm";
        case ".html":
            return "text/html";
        case ".json":
            return "application/json";
        default:
            return "text/plain";
    }
};

const server = http.createServer((req, res) => {
    const requestPath = path.join(homeDir, req.url === "/" ? mainPath : req.url);
    const contentType = getContentType(requestPath);

    fs.readFile(requestPath, (err, data) => {
        if (!err) {
            if (requestPath === path.join(homeDir, mainPath)) {
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            }
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Content-Type", contentType);
            res.writeHead(200).end(data, "utf-8");
        } else if (err?.code === "ENOENT") {
            res.writeHead(404).end();
        } else {
            res.writeHead(500).end();
        }
    });
}).listen(PORT);
console.log("Listening on port: " + PORT);

process.once("SIGINT", () => server.close());
process.once("SIGTERM", () => server.close());
