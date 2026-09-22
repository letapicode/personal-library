import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const userDataPath = app.getPath('userData');
const COURSE_FILE = path.join(userDataPath, 'course_data.json');
const PREFS_FILE = path.join(userDataPath, 'user_preferences.json');

export async function atomicWriteJson(targetFile: string, data: any): Promise<void> {
  const tmpFile = targetFile + '.tmp';
  const bakFile = targetFile + '.bak';

  await fs.mkdir(userDataPath, { recursive: true });
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');

  try {
    await fs.copyFile(targetFile, bakFile);
  } catch {
    // Best-effort backup; don't fail if this errors
  }

  try {
    await fs.rename(tmpFile, targetFile);
  } catch (err: any) {
    // On Windows (NTFS), rename across an existing file can throw EPERM or EEXIST.
    // Fall back to copyFile + unlink for resilient replacement.
    if (err.code === 'EPERM' || err.code === 'EEXIST') {
      await fs.copyFile(tmpFile, targetFile);
      await fs.unlink(tmpFile).catch(() => {});
    } else {
      throw err;
    }
  }
}

export async function readCourseData(): Promise<any | null> {
  try {
    const data = await fs.readFile(COURSE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Attempt fallback from .bak file if primary read or JSON parse failed
    try {
      const bakData = await fs.readFile(COURSE_FILE + '.bak', 'utf-8');
      return JSON.parse(bakData);
    } catch {
      return null;
    }
  }
}

export async function writeCourseData(data: any): Promise<boolean> {
  try {
    await atomicWriteJson(COURSE_FILE, data);
    return true;
  } catch (err) {
    console.error('Failed to write course data:', err);
    return false;
  }
}

export async function readPreferences(): Promise<any | null> {
  try {
    const data = await fs.readFile(PREFS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Attempt fallback from .bak file if primary read or JSON parse failed
    try {
      const bakData = await fs.readFile(PREFS_FILE + '.bak', 'utf-8');
      return JSON.parse(bakData);
    } catch {
      return null;
    }
  }
}

export async function writePreferences(data: any): Promise<boolean> {
  try {
    await atomicWriteJson(PREFS_FILE, data);
    return true;
  } catch (err) {
    console.error('Failed to save preferences:', err);
    return false;
  }
}
