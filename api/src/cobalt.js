import "dotenv/config";

import express from "express";
import cluster from "node:cluster";

import path from "path";
import { fileURLToPath } from "url";

import { env, isCluster } from "./config.js"
import { Red } from "./misc/console-text.js";
import { initCluster } from "./misc/cluster.js";
import { setupEnvWatcher } from "./core/env.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).slice(0, -4);

app.disable("x-powered-by");

// SoufTube single-origin build: API under /api, static frontend at /.
// API routes remain available; frontend fallback handles browser navigation.
const staticFrontend = express.static("/app/web", { index: "index.html" });
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith("/_app") && !req.query.v) {
        const separator = req.originalUrl.includes("?") ? "&" : "?";
        return res.redirect(302, `${req.originalUrl}${separator}v=souftube-api2`);
    }
    return staticFrontend(req, res, next);
});
app.use((req, _res, next) => {
    if (!req.url.startsWith("/api")) return next();
    req.url = "/" + req.url.replace(/^\/api\/?/, "").replace(/^\/+/, "");
    next();
});

if (env.apiURL) {
    const { runAPI } = await import("./core/api.js");

    if (isCluster) {
       await initCluster();
    }

    if (env.envFile) {
        setupEnvWatcher();
    }

    await runAPI(express, app, __dirname, cluster.isPrimary);

    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/")) return next();
        res.sendFile("/app/web/index.html");
    });
} else {
    console.log(
        Red("API_URL env variable is missing, cobalt api can't start.")
    )
}
