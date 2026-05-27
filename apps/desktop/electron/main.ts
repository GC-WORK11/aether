import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { spawn } from 'child_process'

// Disable sandbox and GPU acceleration for stability on diverse Linux distros
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-gpu') // Force software rendering if GPU crashes
app.commandLine.appendSwitch('disable-software-rasterizer')

if (require('electron-squirrel-startup')) app.quit()

let mainWindow: BrowserWindow | null = null
let backendProcess: ReturnType<typeof spawn> | null = null

// Catch unhandled crashes
process.on('uncaughtException', (error) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', error)
})
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

async function startBackend() {
  const backendPath = '/home/govinda/aether/backend'
  const python = process.platform === 'win32'
    ? 'python'
    : 'python3'

  // Check if backend is already running on port 8000
  try {
    const http = await import('node:net')
    const sock = new http.Socket()
    const portFree = await new Promise<boolean>(res => {
      sock.connect(8000, '127.0.0.1', () => { sock.destroy(); res(false) })
      sock.on('error', () => res(true))
      sock.setTimeout(500)
    })
    if (!portFree) {
      console.log('[Backend] Already running on port 8000, skipping start')
      return
    }
  } catch { /* net module not available */ }

  backendProcess = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'], {
    cwd: backendPath,
    stdio: 'pipe',
  })
  backendProcess.stdout?.on('data', (d) => console.log('[Backend]', d.toString().trim()))
  backendProcess.stderr?.on('data', (d) => console.error('[Backend]', d.toString().trim()))
  backendProcess.on('error', (e) => console.error('[Backend] spawn error:', e))
}

function createWindow() {
  // Prevent double-window: if a window already exists, focus it instead of creating a new one
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus()
    return
  }

  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1024, minHeight: 700,
    title: 'AETHER Studio',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
}

app.whenReady().then(() => {
  if (VITE_DEV_SERVER_URL) startBackend()
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('before-quit', () => { if (backendProcess) backendProcess.kill() })

ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('open-external', (_e, url: string) => shell.openExternal(url))
