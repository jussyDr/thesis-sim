const { app, BrowserWindow } = require('electron/main')

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });

    win.loadFile('index.html');

    // win.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
