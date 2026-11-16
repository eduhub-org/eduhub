// Local dev server for the Node cloud functions, run inside the
// node_functions container by start-node.sh.
//
// It starts exactly the Node units listed in units.json (the same list the
// zip workflow packages): installs each unit's dependencies, then runs its
// `npm run watch` with PORT set to the unit's port from units.json. A unit
// that fails to install stops the whole server, so a broken unit is visible
// instead of silently missing.
//
// It also serves the emulated "Google Cloud Storage" bucket on port 4001.

const path = require("path");
const child_process = require("child_process");
const express = require("express");

const units = require(path.join(__dirname, "units.json")).filter(
  (unit) => unit.runtime === "node"
);

function watchChildProc(cproc, name) {
  cproc.stdout.on("data", (data) =>
    console.log("[WATCH " + name + "]", data.toString())
  );
  cproc.stderr.on("data", (data) =>
    console.log("[ERROR WATCH " + name + "]", data.toString())
  );
  cproc.on("error", (error) => {
    console.log("ERROR WATCH SPAWN " + name, error);
  });
  cproc.on("close", (code) =>
    console.log("[WATCH " + name + "] closed with code " + code)
  );
}

console.log(
  "Will serve functions",
  units.map((unit) => `${unit.name}:${unit.port}`)
);

for (const unit of units) {
  const cwd = path.join(__dirname, unit.name);
  console.log("npm install " + cwd);
  try {
    child_process.execSync("npm install --silent --no-audit --no-fund", {
      cwd,
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`Installing dependencies for ${unit.name} failed`, e.message);
    process.exit(1);
  }

  const watchProc = child_process.spawn("npm", ["run", "watch"], {
    cwd,
    env: { ...process.env, PORT: String(unit.port) },
  });
  watchChildProc(watchProc, unit.name);
}

const app = express();
app.use(express.static("/home/node/www"));
app.listen(4001, "0.0.0.0", () => {
  console.log("Serving files...");
});
