// electron/electron.js
const path = require('path');
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const fs = require("fs");
const isDev = process.env.IS_DEV == "true" ? true : false;
const Koa = require('koa');
const koaApp = new Koa();
const KoaStatic = require('koa-static');

if(isDev){
  koaApp.use(KoaStatic(path.join(process.cwd(), 'extraResources'),{extensions:["html"]}))
}else{
  koaApp.use(KoaStatic(path.join(process.cwd(), '/resources/extraResources'),{extensions:["html"]}))
}

koaApp.listen(8888, () => {
  console.log('app is starting at propt 8888..')
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 830,
    titleBarStyle: 'hidden',
    frame: false,
    resizable: false, //禁止改变主窗口尺寸
    icon:  path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      // 使用webview
      webviewTag: true,
      // 取消跨域限制
      webSecurity: false,
      // 支持多线程
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true, //放开权限
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,  
      contextIsolation: false,
      worldSafeExecuteJavaScript: false,
      enableRemoteModule: true
      // sandbox: true,    //沙盒选项,这个很重要
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

ipcMain.on('open-file-dialog', async (event, params) => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'openDirectory']
  }).then(result => {
    event.sender.send('select-file', result.filePaths)
    
  }).catch(err => {
    console.log(err)
  })

})

ipcMain.on('min-win',async (e)=>{
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.minimize();
});

ipcMain.on('close-win',async (e)=>{
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.close();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // hide menu for Mac 
  // if (process.platform !== 'darwin') {
  //   app.dock.hide();
  // }

  createWindow()
  let h5Url = '';
  if (isDev) {
    h5Url = path.join(process.cwd(), 'extraResources','index.html')
  }else{
    h5Url = path.join(process.cwd(), '/resources/extraResources','index.html')
  }

  let baseHtml = `
  <!DOCTYPE html><html><head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0">
  <meta name="screen-orientation" content="portrait">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="format-detection" content="telephone=no">
  <meta name="full-screen" content="yes">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="renderer" content="webkit">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Cache-Control" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="x5-fullscreen" content="true">
  <meta content="yes" name="apple-touch-fullscreen">
  <meta content="telephone=no,email=no" name="format-detection">
  <meta content="modeName=750-12" name="grid">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="360-site-verification" content="e3a4e27d52f6fa2bb8294954664e206b">
  <title></title>
</head>
<body>
  <div class="main"><div>原始文件</div></div>
</body></html>
`;
  fs.writeFile(h5Url, baseHtml, err => {
    if(err){
      throw err;
      return ;
    }
  })
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});