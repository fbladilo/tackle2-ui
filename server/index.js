const express = require("express");
const path = require("path");
const app = express(),
  bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { createHttpTerminator } = require("http-terminator");

const setupProxy = require("./setupProxy");

const port = 8080;

const helpers = require("./helpers");
app.use(cookieParser());

setupProxy(app);

app.engine("ejs", require("ejs").renderFile);

app.use(bodyParser.json());
app.set("views", path.join(__dirname, "../client/dist"));
app.use(express.static(path.join(__dirname, "../client/dist")));
const brandType = process.env["PROFILE"] || "konveyor";

app.get("*", (_, res) => {
  if (process.env.NODE_ENV === "development") {
    res.send(`
      <style>pre { margin-left: 20px; }</style>
      You're running in development mode! The UI is served by webpack-dev-server on port 9000: <a href="http://localhost:9000">http://localhost:9000</a><br /><br />
      If you want to serve the UI via express to simulate production mode, run a full build with: <pre>npm run build</pre>
      and then in two separate terminals, run: <pre>npm run port-forward</pre> and: <pre>npm run start</pre> and the UI will be served on port 8080.
    `);
  } else {
    res.render("index.html.ejs", {
      _env: helpers.getEncodedEnv(),
      brandType,
    });
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on port::${port}`);
});

const httpTerminator = createHttpTerminator({ server });

const shutdown = async (signal) => {
  if (!server) {
    console.log(`${signal}, no server running.`);
    return;
  }

  console.log(`${signal} - Stopping server on port::${port}`);
  await httpTerminator.terminate();
  console.log(`${signal} - Stopped server on port::${port}`);
};

// Handle shutdown signals Ctrl-C (SIGINT) and default podman/docker stop (SIGTERM)
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
