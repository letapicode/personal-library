import { contextBridge, ipcRenderer } from 'electron';
import type { CourseState, UserPreferences, SharedConversationImportResult } from '../src/types/course';

contextBridge.exposeInMainWorld('electronAPI', {
  loadCourseData: (): Promise<CourseState | null> => ipcRenderer.invoke('storage:loadCourse'),
  saveCourseData: (course: CourseState): Promise<boolean> => ipcRenderer.invoke('storage:saveCourse', course),
  loadPreferences: (): Promise<UserPreferences | null> => ipcRenderer.invoke('storage:loadPreferences'),
  savePreferences: (prefs: UserPreferences): Promise<boolean> => ipcRenderer.invoke('storage:savePreferences', prefs),
  importFromSharedUrl: (url: string, assistantOnly: boolean): Promise<SharedConversationImportResult> =>
    ipcRenderer.invoke('importer:fromUrl', url, assistantOnly),
  openFileDialog: (): Promise<{ canceled: boolean; content?: string; filename?: string }> =>
    ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('dialog:saveFile', defaultName, content)
});
