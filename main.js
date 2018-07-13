const {app, BrowserWindow} = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

let win;

let createWindow = () => {
	win = new BrowserWindow({width: 1280, height: 720});

	win.loadURL(url.format({
		pathname: path.join(__dirname, "index.html"),
		protocol: "file",
		slashes: true
	}));

	win.webContents.on("did-finish-load", async () => {
		win.webContents.send("data", JSON.parse(fs.readFileSync("clusters", "UTF-8")));
//		win.webContents.send("data", await bitmex.get_bars("XRPZ17"));
//		win.webContents.send("data", await bitmex.get_bars("ETHZ17"));
	});

	win.on("closed", () => {
		win = null;
	});
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
	app.quit();
});

app.on("activate", () => {
	if (!win) createWindow();
});

