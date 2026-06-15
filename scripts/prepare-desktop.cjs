/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
  force: true,
});
fs.cpSync(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  {
    recursive: true,
    force: true,
  },
);

const runtimeDirectory = path.join(standalone, "runtime");
fs.mkdirSync(runtimeDirectory, { recursive: true });
fs.copyFileSync(process.execPath, path.join(runtimeDirectory, "node.exe"));
