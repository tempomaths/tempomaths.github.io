const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("autoMathsDesktop", {
  platform: process.platform
});
