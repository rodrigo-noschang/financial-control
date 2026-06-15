/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");

const HOSTNAME = "127.0.0.1";
const PORT = 3210;
const APP_URL = `http://${HOSTNAME}:${PORT}`;

let mainWindow;
let serverProcess;

function startServer() {
  const env = {
    ...process.env,
    HOSTNAME,
    PORT: String(PORT),
  };

  if (!app.isPackaged) {
    serverProcess = spawn(
      "npm.cmd",
      ["run", "dev", "--", "--hostname", HOSTNAME, "--port", String(PORT)],
      {
        cwd: path.resolve(__dirname, ".."),
        env,
        stdio: "inherit",
        windowsHide: true,
      },
    );
    return;
  }

  const serverPath = path.join(process.resourcesPath, "standalone", "server.js");
  const nodePath = path.join(
    process.resourcesPath,
    "standalone",
    "runtime",
    "node.exe",
  );
  serverProcess = spawn(nodePath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...env,
      NODE_ENV: "production",
    },
    stdio: "ignore",
    windowsHide: true,
  });
}

async function waitForServer(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess?.exitCode !== null && serverProcess?.exitCode !== undefined) {
      throw new Error(`O servidor local foi encerrado com codigo ${serverProcess.exitCode}.`);
    }

    try {
      const response = await fetch(APP_URL);
      if (response.ok) return;
    } catch {
      // The local server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error("O servidor local demorou demais para iniciar.");
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#171b24",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  await mainWindow.loadURL(APP_URL);
}

app.whenReady().then(async () => {
  try {
    startServer();
    await waitForServer();
    await createWindow();
  } catch (error) {
    dialog.showErrorBox(
      "Controle Financeiro",
      error instanceof Error ? error.message : "Nao foi possivel iniciar o aplicativo.",
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
  }
});
