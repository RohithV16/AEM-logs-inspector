const express = require('express');
const {
  buildDownloadCommand,
  getAioCommandPreview,
  getEstimatedDateRange,
  fetchProgramsFromCloudManager,
  fetchEnvironmentsFromCloudManager,
  listAvailableLogOptions,
  downloadLogs,
  describeDownloadedFiles
} = require('../services/cloudManagerService');
const { analyzeResolvedLogFile } = require('../services/logAnalysisService');
const { sanitizeErrorMessage } = require('../utils/files');

function createCloudManagerRouter() {
  const router = express.Router();

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

  router.get('/cloudmanager/programs', async (_req, res) => {
    try {
      const programs = await fetchProgramsFromCloudManager();
      res.json({ success: true, programs, loadedAt: new Date().toISOString() });
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
