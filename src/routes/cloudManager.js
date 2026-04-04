const express = require('express');
const path = require('path');
const {
  buildCloudManagerSetupPreview,
  checkPrerequisites,
  buildDownloadCommand,
  getAioCommandPreview,
  getEstimatedDateRange,
  refreshCloudManagerMetadataCache,
  getCachedPrograms,
  getCachedEnvironments,
  listAvailableLogOptions,
  downloadLogs,
  describeDownloadedFiles,
  setupCloudManager
} = require('../services/cloudManagerService');
const { analyzeResolvedLogFile } = require('../services/logAnalysisService');
const { sanitizeErrorMessage } = require('../utils/files');

function createCloudManagerRouter() {
  const router = express.Router();

  router.get('/cloudmanager/check-prerequisites', async (_req, res) => {
    try {
      const result = await checkPrerequisites();
      res.json({ success: true, ...result });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/validate-output-directory', async (req, res) => {
    try {
      const { outputDirectory } = req.body || {};
      const { validateOutputDirectory } = require('../services/cloudManagerService');
      const resolved = validateOutputDirectory(outputDirectory);
      res.json({ success: true, resolved });
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

  router.post('/cloudmanager/setup-preview', async (req, res) => {
    try {
      const preview = buildCloudManagerSetupPreview(req.body || {});
      res.json({ success: true, ...preview });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/setup', async (req, res) => {
    try {
      const result = await setupCloudManager(req.body || {});
      res.json({
        success: result.ok,
        error: result.ok ? '' : sanitizeErrorMessage(result.error || 'Cloud Manager setup failed.'),
        steps: result.steps || [],
        preview: result.preview || null,
        prerequisites: result.prerequisites || null,
        cache: result.cache || null,
        configPath: result.configPath || ''
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/cloudmanager/refresh-cache', async (_req, res) => {
    try {
      const cache = await refreshCloudManagerMetadataCache();
      res.json({
        success: true,
        refreshedAt: cache.refreshedAt,
        programs: cache.programs,
        totalPrograms: cache.programs.length,
        totalEnvironments: Object.values(cache.environmentsByProgram || {}).reduce((sum, list) => sum + list.length, 0),
        environmentErrors: cache.environmentErrors || []
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/programs', async (_req, res) => {
    try {
      const { programs, refreshedAt } = getCachedPrograms();
      res.json({ success: true, programs, refreshedAt });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.get('/cloudmanager/programs/:programId/environments', async (req, res) => {
    try {
      const { environments, refreshedAt } = getCachedEnvironments(req.params.programId);
      res.json({ success: true, environments, refreshedAt });
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

  router.post('/cloudmanager/download-analyze', async (req, res) => {
    try {
      const {
        programId,
        environmentId,
        selections = [],
        service,
        logName,
        days,
        outputDirectory
      } = req.body || {};

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
      const preferredDownload = downloadedFilesDetailed.find((file) => file.supported) || null;
      if (!preferredDownload) {
        return res.json({
          success: true,
          source: 'cloudmanager',
          logType: 'unknown',
          logFamily: 'unknown',
          supported: false,
          unsupportedReason: 'Downloaded files were recognized, but none match a supported parser yet.',
          downloadedFiles: downloads.flatMap((entry) => entry.downloadedFiles),
          downloadedFilesDetailed,
          analyzedFile: '',
          defaultAnalyzedFile: '',
          outputDirectory: primaryDownload.outputDirectory,
          commandPreview: primaryDownload.commandPreview,
          fileDates: primaryDownload.fileDates,
          estimatedDateRange: getEstimatedDateRange(days || 1),
          downloads
        });
      }

      const preferredDownloadFile = preferredDownload.filePath;
      const { payload } = await analyzeResolvedLogFile(preferredDownloadFile);
      res.json({
        ...payload,
        source: 'cloudmanager',
        downloadedFiles: downloads.flatMap((entry) => entry.downloadedFiles),
        downloadedFilesDetailed,
        analyzedFile: preferredDownloadFile,
        defaultAnalyzedFile: preferredDownloadFile,
        outputDirectory: primaryDownload.outputDirectory,
        commandPreview: primaryDownload.commandPreview,
        fileDates: primaryDownload.fileDates,
        estimatedDateRange: getEstimatedDateRange(days || 1),
        downloads
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

module.exports = createCloudManagerRouter;
