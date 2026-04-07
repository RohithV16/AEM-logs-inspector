const express = require('express');
const {
  buildDownloadCommand,
  getAioCommandPreview,
  getEstimatedDateRange,
  fetchProgramsFromCloudManager,
  fetchEnvironmentsFromCloudManager,
  listAvailableLogOptions,
  downloadLogs,
  describeDownloadedFiles,
  getCloudManagerCacheRoot,
  getCloudManagerCacheView,
  validateOutputDirectory
} = require('../services/cloudManagerService');
const { sanitizeErrorMessage } = require('../utils/files');

async function performCloudManagerDownload(request = {}, onProgress = null) {
  const {
    programId,
    environmentId,
    selections = [],
    service,
    logName,
    days,
    outputDirectory
  } = request;

  const normalizedSelections = Array.isArray(selections) && selections.length
    ? selections
    : (service && logName ? [{ service, logName }] : []);

  if (!programId || !environmentId || !normalizedSelections.length) {
    throw new Error('Program, environment, and at least one service/log selection are required.');
  }

  const totalSelections = normalizedSelections.length;
  const downloads = [];
  for (let i = 0; i < normalizedSelections.length; i++) {
    const entry = normalizedSelections[i];
    if (onProgress) {
      onProgress({
        currentIndex: i + 1,
        totalFiles: totalSelections,
        currentFile: `${entry.logName} (${entry.service})`,
        message: `Downloading ${entry.logName} from ${entry.service}...`,
        status: 'downloading'
      });
    }
    const download = await downloadLogs({
      programId,
      environmentId,
      service: entry.service,
      logName: entry.logName,
      days,
      outputDirectory
    });
    downloads.push({
      service: entry.service,
      logName: entry.logName,
      ...download
    });
  }

  const primaryDownload = downloads[0];
  const downloadedFilesDetailed = [];
  for (let i = 0; i < downloads.length; i++) {
    const entry = downloads[i];
    const describedFiles = await describeDownloadedFiles(entry);
    downloadedFilesDetailed.push(...describedFiles.map((file) => ({
      ...file,
      service: entry.service,
      logName: entry.logName
    })));
  }

  const supportedFiles = downloadedFilesDetailed.filter((file) => file.supported !== false);

  return {
    success: true,
    source: 'cloudmanager',
    cacheRoot: getCloudManagerCacheRoot(),
    downloadedFiles: downloads.flatMap((entry) => entry.downloadedFiles),
    downloadedFilesDetailed,
    outputDirectory: primaryDownload.outputDirectory,
    environmentDirectory: primaryDownload.environmentDirectory || primaryDownload.outputDirectory,
    commandPreview: primaryDownload.commandPreview,
    fileDates: primaryDownload.fileDates,
    estimatedDateRange: getEstimatedDateRange(days || 1),
    downloads,
    supported: supportedFiles.length > 0,
    unsupportedReason: supportedFiles.length
      ? ''
      : 'Downloaded files were recognized, but none match a supported parser yet.'
  };
}

function createCloudManagerRouter() {
  const router = express.Router();

  router.get('/cloudmanager/auth-check', async (_req, res) => {
    try {
      const { execFile } = require('child_process');
      await new Promise((resolve, reject) => {
        execFile('aio', ['cloudmanager:list-programs', '--json'], { maxBuffer: 1024 * 1024 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      res.json({ success: true, authenticated: true });
    } catch (error) {
      const message = String(error.message || '');
      if (/auth:login|not logged in|login required|expired token|invalid token|access token|unauthorized|401|ims/i.test(message)) {
        res.json({ success: false, authenticated: false, error: 'Adobe aio CLI authentication is incomplete or expired. Run `aio auth:login`.' });
        return;
      }
      if (/command not found|ENOENT|not found/i.test(message)) {
        res.json({ success: false, authenticated: false, error: 'Adobe aio CLI not found. Install it first.' });
        return;
      }
      res.json({ success: false, authenticated: false, error: 'Cloud Manager CLI check failed.' });
    }
  });

  router.post('/cloudmanager/validate-output-directory', async (req, res) => {
    try {
      const cacheRoot = getCloudManagerCacheRoot();
      res.json({ success: true, resolved: validateOutputDirectory(cacheRoot), cacheRoot });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/cache-root', async (_req, res) => {
    try {
      res.json({ success: true, cacheRoot: getCloudManagerCacheRoot() });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/command-preview', async (req, res) => {
    try {
      const {
        programId,
        environmentId,
        days,
        outputDirectory,
        selections = [],
        service,
        logName
      } = req.body || {};

      const normalizedSelections = Array.isArray(selections) && selections.length
        ? selections
        : (service && logName ? [{ service, logName }] : []);

      const commands = normalizedSelections.map((entry) => {
        const args = buildDownloadCommand({
          programId,
          environmentId,
          service: entry.service,
          logName: entry.logName,
          days,
          outputDirectory: outputDirectory || '<output-directory>'
        });
        return {
          service: entry.service,
          logName: entry.logName,
          command: getAioCommandPreview(args)
        };
      });

      res.json({
        success: true,
        commands,
        estimatedDateRange: getEstimatedDateRange(days || 1)
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/programs', async (_req, res) => {
    try {
      const programs = await fetchProgramsFromCloudManager();
      res.json({ success: true, programs, loadedAt: new Date().toISOString(), cacheRoot: getCloudManagerCacheRoot() });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/programs/:programId/environments', async (req, res) => {
    try {
      const environments = await fetchEnvironmentsFromCloudManager(req.params.programId);
      res.json({ success: true, environments, loadedAt: new Date().toISOString() });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/environments/:environmentId/log-options', async (req, res) => {
    try {
      const { programId } = req.query;
      if (!programId) {
        throw new Error('Program ID is required.');
      }

      const logOptions = await listAvailableLogOptions(programId, req.params.environmentId);
      res.json({ success: true, logOptions });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/cache/logs', async (req, res) => {
    try {
      const { programId, environmentId } = req.query || {};
      if (!programId || !environmentId) {
        res.json({
          success: true,
          cacheRoot: getCloudManagerCacheRoot(),
          environmentDirectory: '',
          tiers: [],
          summary: { totalFiles: 0, supportedFiles: 0, tierCount: 0 }
        });
        return;
      }

      res.json({
        success: true,
        ...(await getCloudManagerCacheView(String(programId), String(environmentId)))
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/download', async (req, res) => {
    try {
      res.json(await performCloudManagerDownload(req.body || {}));
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/download-analyze', async (req, res) => {
    try {
      res.json(await performCloudManagerDownload(req.body || {}));
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

module.exports = createCloudManagerRouter;
