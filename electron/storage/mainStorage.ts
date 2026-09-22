import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

const userDataPath = app.getPath('userData');
const COURSE_FILE = path.join(userDataPath, 'course_data.json');
const PREFS_FILE = path.join(userDataPath, 'user_preferences.json');

export async function readCourseData(): Promise<any | null> {
  try {
    const data = await fs.readFile(COURSE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function writeCourseData(data: any): Promise<boolean> {
  try {
    await fs.mkdir(userDataPath, { recursive: true });
    await fs.writeFile(COURSE_FILE, JSON.stringify(data, null, 2), 'utf-8');
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
    return null;
  }
}

export async function writePreferences(data: any): Promise<boolean> {
  try {
    await fs.mkdir(userDataPath, { recursive: true });
    await fs.writeFile(PREFS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save preferences:', err);
    return false;
  }
}
