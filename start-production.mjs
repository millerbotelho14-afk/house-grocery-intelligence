import { spawn } from "child_process";

const children = [];

startProcess(
  "node",
  ["src/server.js"],
  {
    ...process.env,
    PORT: process.env.PORT_API || "4000"
  },
  "apps/api"
);

startProcess(
  "node",
  ["../../node_modules/next/dist/bin/next", "start", "-p", process.env.PORT || "3000", "-H", "0.0.0.0"],
  process.env,
  "apps/web"
);

function startProcess(command, args, env, cwd) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env,
    cwd
  });

  children.push(child);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(0);
}
