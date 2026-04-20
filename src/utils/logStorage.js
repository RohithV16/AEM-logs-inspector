const path = require('path');
const fs = require('fs');
const os = require('os');
const { MAX_FILE_SIZE } = require('./constants');

const STORAGE_DIR = '.aem-logs';
const METADATA_FILE = 'index.json';

function getStorageDir() {
  const homeDir = os.homedir();
  return path.join(homeDir, STORAGE_DIR);
}

function getFileStorageDir(programId, environmentId, logType) {
  return path.join(getStorageDir(), String(programId), String(environmentId), String(logType));
}

function ensureStorageDir() {
  const storageDir = getStorageDir();
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return storageDir;
}

function getMetadataPath() {
  return path.join(getStorageDir(), METADATA_FILE);
}

function loadMetadata() {
  const metaPath = getMetadataPath();
  if (!fs.existsSync(metaPath)) {
    return { files: [], lastUpdated: null };
  }
  try {
    const data = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { files: [], lastUpdated: null };
  }
}

function saveMetadata(metadata) {
  ensureStorageDir();
  const metaPath = getMetadataPath();
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
}

function deleteByOriginalPath(originalPath) {
  const metadata = loadMetadata();
  const existingFile = metadata.files.find(f => f.originalPath === originalPath);
  
  if (existingFile && fs.existsSync(existingFile.storedPath)) {
    fs.unlinkSync(existingFile.storedPath);
  }
  
  metadata.files = metadata.files.filter(f => f.originalPath !== originalPath);
  saveMetadata(metadata);
  
  return !!existingFile;
}

function storeLogFile(sourcePath, options = {}) {
  const { programId, environmentId, logType, source = 'local' } = options;
  
  if (!sourcePath) {
    throw new Error('sourcePath is required');
  }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  
  const sourceStats = fs.statSync(sourcePath);
  
  if (sourceStats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 5GB.`);
  }

  const fileName = path.basename(sourcePath);
  let storageDir;
  let relativePath;
  
  if (programId && environmentId && logType) {
    storageDir = getFileStorageDir(programId, environmentId, logType);
    relativePath = path.join(String(programId), String(environmentId), String(logType), fileName);
  } else {
    storageDir = ensureStorageDir();
    relativePath = fileName;
  }

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const existingMetadata = loadMetadata();
  const existingFile = existingMetadata.files.find(f => f.relativePath === relativePath);
  if (existingFile && fs.existsSync(existingFile.storedPath)) {
    fs.unlinkSync(existingFile.storedPath);
  }

  const destPath = path.join(storageDir, fileName);
  fs.copyFileSync(sourcePath, destPath);
  
  const metadata = loadMetadata();
  
  const fileEntry = {
    id: relativePath,
    originalPath: sourcePath,
    storedPath: destPath,
    relativePath: relativePath,
    fileName: fileName,
    size: sourceStats.size,
    source: source,
    programId: programId ? String(programId) : null,
    environmentId: environmentId ? String(environmentId) : null,
    logType: logType || null,
    storedAt: new Date().toISOString(),
    accessedAt: new Date().toISOString()
  };
  
  metadata.files = metadata.files.filter(f => f.relativePath !== relativePath);
  metadata.files.unshift(fileEntry);
  metadata.lastUpdated = new Date().toISOString();
  
  saveMetadata(metadata);
  
  return fileEntry;
}

function getStoredFile(fileId) {
  const metadata = loadMetadata();
  const fileEntry = metadata.files.find(f => f.id === fileId || f.relativePath === fileId);
  
  if (!fileEntry) {
    return null;
  }
  
  if (!fs.existsSync(fileEntry.storedPath)) {
    return null;
  }
  
  fileEntry.accessedAt = new Date().toISOString();
  saveMetadata(metadata);
  
  return fileEntry;
}

function listStoredFiles() {
  const metadata = loadMetadata();
  return metadata.files.filter(f => fs.existsSync(f.storedPath));
}

function deleteStoredFile(fileId) {
  const metadata = loadMetadata();
  const fileEntry = metadata.files.find(f => f.id === fileId || f.relativePath === fileId);
  
  if (!fileEntry) {
    return false;
  }
  
  if (fs.existsSync(fileEntry.storedPath)) {
    fs.unlinkSync(fileEntry.storedPath);
  }
  
  metadata.files = metadata.files.filter(f => f.id !== fileEntry.id && f.relativePath !== fileEntry.relativePath);
  metadata.lastUpdated = new Date().toISOString();
  saveMetadata(metadata);
  
  return true;
}

function clearAllStoredFiles() {
  const metadata = loadMetadata();
  
  for (const fileEntry of metadata.files) {
    if (fs.existsSync(fileEntry.storedPath)) {
      fs.unlinkSync(fileEntry.storedPath);
    }
  }
  
  saveMetadata({ files: [], lastUpdated: new Date().toISOString() });
}

function findStoredFileByOriginalPath(originalPath) {
  const metadata = loadMetadata();
  return metadata.files.find(f => f.originalPath === originalPath && fs.existsSync(f.storedPath));
}

function buildFileTree(dirPath, basePath = null) {
  if (!basePath) {
    basePath = dirPath;
  }
  
  const stats = fs.statSync(dirPath);
  
  if (stats.isFile()) {
    return {
      path: dirPath,
      relativePath: path.relative(basePath, dirPath),
      name: path.basename(dirPath),
      type: 'file',
      size: stats.size,
      modified: stats.mtime.toISOString()
    };
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const children = [];
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.name.startsWith('.')) continue;
    
    children.push(buildFileTree(entryPath, basePath));
  }
  
  children.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });
  
  return {
    path: dirPath,
    relativePath: path.relative(basePath, dirPath),
    name: path.basename(dirPath),
    type: 'directory',
    children: children
  };
}

function scanStorageFolder() {
  const storageDir = getStorageDir();
  
  if (!fs.existsSync(storageDir)) {
    return {
      path: storageDir,
      relativePath: '',
      name: STORAGE_DIR,
      type: 'directory',
      children: []
    };
  }
  
  return buildFileTree(storageDir);
}

module.exports = {
  getStorageDir,
  getFileStorageDir,
  storeLogFile,
  getStoredFile,
  listStoredFiles,
  deleteStoredFile,
  clearAllStoredFiles,
  findStoredFileByOriginalPath,
  buildFileTree,
  scanStorageFolder
};