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

async function performCloudManagerDownload(request = {}) {
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

  const downloads = [];
  for (const entry of normalizedSelections) {
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
  for (const entry of downloads) {
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
