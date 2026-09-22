import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { readCourseData, writeCourseData, readPreferences, writePreferences } from './storage/mainStorage';
import { importChatGptSharedLink } from './importers/chatGptSharedLinkImporter';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Security: Intercept external link popups and open them in the OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url).catch(console.error);
    }
    return { action: 'deny' };
  });

  // Security: Prevent window navigation to untrusted external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const currentUrl = mainWindow?.webContents.getURL() || '';
    if (navigationUrl !== currentUrl && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      if (navigationUrl.startsWith('https:') || navigationUrl.startsWith('http:')) {
        shell.openExternal(navigationUrl).catch(console.error);
      }
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // IPC: Persistence Handlers
  ipcMain.handle('storage:loadCourse', async () => {
    return await readCourseData();
  });

  ipcMain.handle('storage:saveCourse', async (_, courseData) => {
    return await writeCourseData(courseData);
  });

  ipcMain.handle('storage:loadPreferences', async () => {
    return await readPreferences();
  });

  ipcMain.handle('storage:savePreferences', async (_, prefs) => {
    return await writePreferences(prefs);
  });

  // IPC: Web Scraping Import Handler
  ipcMain.handle('importer:fromUrl', async (_, url: string, assistantOnly: boolean) => {
    try {
      return await importChatGptSharedLink(url, assistantOnly);
    } catch (err: any) {
      return { markdown: '', messageCount: 0, error: err.message || 'Import failed' };
    }
  });

  // IPC: File System Dialogs
  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Course Markdown File',
      filters: [{ name: 'Markdown Documents', extensions: ['md', 'markdown', 'txt'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    return { canceled: false, content, filename: path.basename(filePath) };
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName: string, content: string) => {
    if (!mainWindow) return false;

    // Security: Strip directory traversal sequences and unsafe characters from default filename
    const safeBaseName = path.basename(typeof defaultName === 'string' ? defaultName : 'course_export.md')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);
    const sanitizedDefault = safeBaseName.endsWith('.md') ? safeBaseName : `${safeBaseName}.md`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Course to Markdown',
      defaultPath: sanitizedDefault,
      filters: [{ name: 'Markdown Documents', extensions: ['md', 'markdown'] }]
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    await fs.writeFile(result.filePath, content, 'utf-8');
    return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
