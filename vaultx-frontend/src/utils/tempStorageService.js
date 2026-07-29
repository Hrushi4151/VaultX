const TEMP_STORAGE_KEY = 'vaultx_pdf_temp_storage';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DB_NAME = 'VaultX_TempStorage_DB';
const DB_VERSION = 1;
const STORE_NAME = 'temp_files';

// Helper to open IndexedDB
const getDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const tempStorageService = {
  // Save PDF / Document blob or ArrayBuffer to 7-Day Temporary Storage (IndexedDB + LocalStorage)
  saveFile: async (fileBlobOrBuffer, fileName, fileType = 'application/pdf') => {
    try {
      const now = Date.now();
      const expiresAt = now + SEVEN_DAYS_MS;
      const fileId = `temp_${now}_${Math.random().toString(36).substr(2, 5)}`;

      let blobData;
      let size = 0;

      if (fileBlobOrBuffer instanceof Blob) {
        blobData = fileBlobOrBuffer;
        size = fileBlobOrBuffer.size;
      } else if (fileBlobOrBuffer instanceof ArrayBuffer) {
        blobData = new Blob([fileBlobOrBuffer], { type: fileType });
        size = fileBlobOrBuffer.byteLength;
      } else if (ArrayBuffer.isView(fileBlobOrBuffer)) {
        blobData = new Blob([fileBlobOrBuffer], { type: fileType });
        size = fileBlobOrBuffer.byteLength;
      } else if (typeof fileBlobOrBuffer === 'string') {
        if (fileBlobOrBuffer.startsWith('data:')) {
          const res = await fetch(fileBlobOrBuffer);
          blobData = await res.blob();
        } else {
          blobData = new Blob([fileBlobOrBuffer], { type: fileType });
        }
        size = blobData.size;
      } else {
        blobData = new Blob([fileBlobOrBuffer], { type: fileType });
        size = blobData.size || 0;
      }

      // Convert to base64 for fallback in localStorage if small, else save Blob to IndexedDB
      let base64Data = null;
      if (size < 4 * 1024 * 1024) { // Under 4MB can fit in base64 fallback
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blobData);
        });
      }

      // 1. Save Blob to IndexedDB for high-performance retrieval
      const db = await getDB();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put({ id: fileId, blob: blobData, name: fileName, type: fileType, expiresAt });
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => reject(e.target.error);
        });
      }

      // 2. Save Metadata to LocalStorage for fast UI rendering
      const existing = tempStorageService.getFiles();
      const newEntry = {
        id: fileId,
        name: fileName,
        type: fileType,
        size,
        createdAt: now,
        expiresAt,
        dataUrl: base64Data
      };

      const updated = [newEntry, ...existing];
      localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(updated));
      return newEntry;
    } catch (err) {
      console.error('Failed to save to temporary storage:', err);
      throw err;
    }
  },

  // Get active (non-expired) temporary files metadata
  getFiles: () => {
    try {
      const raw = localStorage.getItem(TEMP_STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      const now = Date.now();

      // Auto-delete metadata older than 7 days
      const valid = list.filter(item => item.expiresAt > now);
      if (valid.length !== list.length) {
        localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(valid));
        // Clean up IndexedDB in background
        tempStorageService.purgeExpiredIndexedDB(now);
      }
      return valid;
    } catch (err) {
      return [];
    }
  },

  // Retrieve raw Blob for a temp file (from IndexedDB or dataUrl fallback)
  getFileBlob: async (fileMeta) => {
    try {
      const db = await getDB();
      if (db) {
        const item = await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(fileMeta.id);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        });
        if (item && item.blob) {
          return item.blob;
        }
      }

      // Fallback: fetch from dataUrl
      if (fileMeta.dataUrl) {
        const res = await fetch(fileMeta.dataUrl);
        return await res.blob();
      }
      throw new Error('File data not found in temporary storage');
    } catch (err) {
      console.error('Failed to get file blob from temp storage:', err);
      throw err;
    }
  },

  // Retrieve ArrayBuffer for PDF operations
  getFileArrayBuffer: async (fileMeta) => {
    const blob = await tempStorageService.getFileBlob(fileMeta);
    return await blob.arrayBuffer();
  },

  // Retrieve ObjectURL for live preview / iframe
  getFileObjectURL: async (fileMeta) => {
    const blob = await tempStorageService.getFileBlob(fileMeta);
    return URL.createObjectURL(blob);
  },

  // Calculate human readable time remaining
  getTimeRemaining: (expiresAt) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  },

  // Remove single file
  removeFile: async (id) => {
    const list = tempStorageService.getFiles();
    const updated = list.filter(item => item.id !== id);
    localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(updated));

    const db = await getDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    }
  },

  // Clear all temporary files
  clearAll: async () => {
    localStorage.removeItem(TEMP_STORAGE_KEY);
    const db = await getDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    }
  },

  // Background cleanup for expired files in IndexedDB
  purgeExpiredIndexedDB: async (now) => {
    try {
      const db = await getDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        all.forEach(item => {
          if (item.expiresAt <= now) {
            store.delete(item.id);
          }
        });
      };
    } catch (e) {
      // Ignore cleanup error
    }
  }
};
