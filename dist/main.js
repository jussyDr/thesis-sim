var _a = require('electron/main'), app = _a.app, BrowserWindow = _a.BrowserWindow;
function createWindow() {
    var win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });
    win.loadFile('../src/index.html');
    win.webContents.openDevTools();
}
app.whenReady().then(function () {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
