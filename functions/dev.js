// This script is run inside a docker container with node
// it takes care of running npm install in all the directories for the functions
// and calling npm run watch on each of them to startup the functions
// basically this script is the server for the serverless functions

// then it starts an express static serve to serve the files stored in "google cloud storage", which is not real google cloud storage during development time

const fs = require("fs");
const child_process = require("child_process");
const express = require("express");

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

// dirs which do not contain the standard setup with one js function and package.json for it
const EXCLUDE_DIRS = ["lib", "callPythonFunction", "node_modules"];

const getDirectories = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const dirs = getDirectories("/functions").filter(
  (x) => !EXCLUDE_DIRS.includes(x)
);

console.log("Will serve functions", dirs);

for (const dir of dirs) {
  const cmd = `npm install --silent`;
  const cwd = "/functions/" + dir;
  console.log("npm install " + cwd);

  try {
    child_process.execSync(cmd, {
      cwd,
    });
  
    const watchProc = child_process.spawn("npm", ["run", "watch"], {
      cwd,
    });
    watchChildProc(watchProc, dir);
  } catch (e) {
    // if one fails, dont fail all, somehow createAchivementCertificate fails in my local system and it is not needed for me anyway
    console.log("Failed stup of node cloud function!!!!", dir, e);
  }
}

const app = express();
app.use(express.static("/home/node/www"));
app.listen(4001, "0.0.0.0", () => {
  console.log("Serving files...");
});
