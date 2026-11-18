// Local dev server for the Node cloud functions, run inside the
// node_functions container by start-node.sh.
//
// It starts exactly the Node units listed in units.json (the same list the
// zip workflow packages): installs each unit's dependencies from its
// committed package-lock.json (`npm ci`, as the Cloud Functions build does,
// so a host-built node_modules for another OS never leaks in), then runs its
// `npm run watch` with PORT set to the unit's port from units.json. A unit
// that fails to install stops the whole server, so a broken unit is visible
// instead of silently missing.
//
// A unit with a `source` (identity, media) has no folder of its own: it runs
// another unit's code with its own entry point, as in production, where
// Terraform deploys that unit's zip with a different `entry_point`. It is
// started from the source folder with FUNCTION_TARGET set to its entryPoint
// (the source unit's start script passes it as --target) and reuses the
// source unit's install.
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

// Install every folder once, before any unit starts, so a unit with a
// `source` never starts against a half-installed node_modules.
for (const unit of units.filter((unit) => !unit.source)) {
  const cwd = path.join(__dirname, unit.name);
  console.log("npm ci " + cwd);
  try {
    child_process.execSync("npm ci --silent --no-audit --no-fund", {
      cwd,
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`Installing dependencies for ${unit.name} failed`, e.message);
    process.exit(1);
  }
}

for (const unit of units) {
  const cwd = path.join(__dirname, unit.source || unit.name);
  const watchProc = child_process.spawn("npm", ["run", "watch"], {
    cwd,
    env: {
      ...process.env,
      PORT: String(unit.port),
      FUNCTION_TARGET: unit.entryPoint,
    },
  });
  watchChildProc(watchProc, unit.name);
}

const app = express();
app.use(express.static("/home/node/www"));
app.listen(4001, "0.0.0.0", () => {
  console.log("Serving files...");
});
