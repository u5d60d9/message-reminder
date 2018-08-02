// Modules to control application life and create native browser window
const { autoUpdater } = require("electron-updater")
const path = require('path')
const electron = require('electron')
const { app, dialog, Menu, Tray, BrowserWindow, Notification, ipcRenderer, ipcMain, nativeImage } = electron
const io = require('socket.io-client');
var toml = require('toml');
var fs = require('fs');
var tomlify = require('tomlify-j0.4');

app.setName("消息提醒程序")

autoUpdater.on('update-downloaded', (ev, info) => {
  var alert_msg = { title: "新版本下载完毕", timestamp: new Date().toLocaleTimeString(), content: "新版本将在程序退出时安装！" };
    alertWindow.webContents.send('alert-msg', alert_msg);
    alertWindow.show();
})

 const programPath = (electron.app || electron.remote.app).getAppPath();
const dataPath = (electron.app || electron.remote.app).getPath('userData');

const appFileUrl = path.join(programPath, 'resources/config/app.config');
const configfileUrl = path.join(dataPath, 'app.config');
//  let contentText;
let appconfig;
//copy installer to userdata
if (fs.existsSync(configfileUrl)) {
  //  var fse = require('fs-extra');
  //   fse.copySync(appFileUrl,configfileUrl)
  var contentText = fs.readFileSync(configfileUrl);
  appconfig = toml.parse(contentText)
} else {
  //default config 
  appconfig = {
    login: {
      // server:"http://10.5.10.6:3000",
      // server:"http://121.43.163.226:3050",
      server: "http://sol-msg.fdcyun.com:4000",
      user: ""
    },
    options: {
      blink_on_message: true,
      alert_on_message: true,
      keep_history: false
    }
  }
}

const normal_icon = "resources/assets/icon/favicon.png"
const normal_iconPath =  path.resolve(__dirname,'assets','icon','favicon.png')
const blink_icon = 'resources/assets/icon/favicon.ico';
const blink_iconPath =  path.resolve(__dirname,'assets','icon','favicon.ico')

let uid //login id
let mainWindow
let alertWindow
let historyWindow
let blinker = null;
let tray = null
let server;
// let lastmsg;


server = appconfig.login.server;
uid = appconfig.login.user;

const socket = io(server);
var template = [
  {
    label: '关闭',
    click: function () { app.exit() },
    // submenu: [
    //   {
    //     label: 'Undo',
    //     accelerator: 'CmdOrCtrl+Z',
    //     role: 'undo'
    //   }
    // ]
  },
  {
    label: '版本',
    click: () => {
      mainWindow.webContents.executeJavaScript("alert('" + "版本:V" + app.getVersion() + "');");
      //  dialog.showMessageBox({type:"info",title:"信息",message:"版本:v"+version,buttons:[]}) 
    }
  }
]
var mainMenu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(mainMenu);


ipcMain.on('startfill', (event, arg) => {
  event.sender.send("fill", appconfig.login.user);
})



ipcMain.on('login', (event, arg) => {
  login(arg);
})


function login(arg) {
  //add stuff
  appconfig.login.user = arg;
  uid = arg;
  socket.emit("set-name", uid);

  fs.writeFile(configfileUrl, tomlify.toToml(appconfig));

  mainWindow.hide()
}

function stopBlinkImage() {
  // dialog.showMessageBox({type:"info",title:"信息",message:"stop"});
  try {
    if (blinker !== null) {
      clearInterval(blinker);
      blinker = null;
    }
    tray.setImage(normal_iconPath);
  } catch (e) {

  }
}

function startBlinkImage() {
  try {
    if (blinker == null) {
      let on = false;
      blinker = setInterval(function () {
        var icon = nativeImage.createFromPath(on ? blink_iconPath : normal_iconPath);
        tray.setImage(icon);
        on = !on;
      }, 500);
    }
  } catch (e) {

  }
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      width: 320,
      height: 240,
      frame: true,
      // skipTaskbar:true,
      alwaysOnTop: true,
      title: "消息提醒程序",
      show: false
    }
  )

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  alertWindow = new BrowserWindow(
    {
      width: 422,
      height: 158,
      // useContentSize:true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      focusable: false,
      skipTaskbar: true,
      movable: false,
      show: false,
      backgroundColor: '#2e2c29'
    }
  )

  historyWindow = new BrowserWindow(
    {
      width: 800,
      height: 600,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      resizable: false,
      title: "查看消息"
    }
  )

  alertWindow.loadFile('alert.html')

  var area = electron.screen.getPrimaryDisplay().workAreaSize
  alertWindow.setPosition(area.width - 442, area.height - 174)

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // mainWindow.once('focus', () => mainWindow.flashFrame(false))
  // mainWindow.flashFrame(true)
  historyWindow.loadFile('history.html')
  // Open the DevTools.
  //  mainWindow.webContents.openDevTools()
  mainWindow.on('close', function (e) {
    mainWindow.hide()
    e.preventDefault()
  })
  historyWindow.on('close', function (e) {
    historyWindow.hide()
    e.preventDefault()
  })
  alertWindow.on("click", () => { alertWindow.hide(); })
  ipcMain.on("alert-close", (evt, arg) => {
    alertWindow.hide();
    stopBlinkImage();
  })

  // ipcMain.on('alert-ready', (evt, arg) => {
  //       var date = new Date().toLocaleTimeString() ;
  //       evt.sender.send('alert-msg', lastmsg);
  //   });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

//单例~BEGIN
const shouldQuit = app.makeSingleInstance(
  (commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      } else if (!mainWindow.isVisible) {
        mainWindow.show();
      };
      mainWindow.focus();
    };
  });

if (shouldQuit) {
  app.quit();
  return;
};
//单例~END


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow)
app.on('window-all-closed', () => {
  app.quit();
});
app.on('ready', () => {
  try {
 
    tray = new Tray(nativeImage.createFromPath(normal_iconPath));
    // tray = new Tray(nativeImage.createFromPath(normal_iconPath));  
    //tray = new Tray(normal_icon)
  } catch (e) {

  }

  const contextMenu = Menu.buildFromTemplate([
    { label: '登录窗口', click: () => { mainWindow.show(); } },
    { label: '闪烁图标', type: "checkbox", checked: true, enabled: appconfig.options.blink_on_message },
    { label: '弹出消息', type: "checkbox", checked: true, enabled: appconfig.options.alert_on_message },
    { label: '保留历史', type: "checkbox", checked: true, enabled: appconfig.options.keep_history },
    { label: '退出', click: function (evt) { app.exit(); } }
  ])

  tray.setToolTip('消息提醒')
  tray.setContextMenu(contextMenu)
  tray.on("click", stopBlinkImage)
  tray.on("double-click", () => {
    historyWindow.webContents.send("display-history-msg");
    historyWindow.show()
  })

  //init socketio 
  socket.emit("set-name", uid);
  socket.on("msg", function (data) {
    //tray.displayBalloon({title:data.cst+" " + date,content:data.msg})  



    var date = new Date().toLocaleTimeString();
    // evt.sender.send('alert-msg', {title:data.cst+" " + date,content:data.msg})
    var alert_msg = { title: data.cst, timestamp: date, content: data.msg };
    alertWindow.webContents.send('alert-msg', alert_msg);
    historyWindow.webContents.send('alert-msg', alert_msg);
    //如果是打开状态，刷新内容
    if (historyWindow.isVisible) {
      historyWindow.webContents.send("display-history-msg");
    }
    // lastmsg =  {title:data.cst+" " + date,content:data.msg};
    // alertWindow.reload();
    alertWindow.show();

    startBlinkImage()
  })
  socket.on('reconnect', (attemptNumber) => {
    socket.emit("set-name", uid);
  });
  autoUpdater.checkForUpdatesAndNotify();
  createWindow()
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
