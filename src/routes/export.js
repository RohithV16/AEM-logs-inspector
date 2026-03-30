/* === Imports === */
const express = require('express');
const { exportToCSV, exportToJSON, generatePDFSummary } = require('../exporter');
const { checkAlerts } = require('../alerts');
const { sanitizeErrorMessage } = require('../utils/files');

/**
 * Creates the export router with endpoints for exporting data and checking alerts
 * @returns {express.Router} Express router with export endpoints
 */
function createExportRouter() {
  const router = express.Router();

  /* === POST /api/alerts/check === */
  /* Evaluate log summary against configured thresholds to trigger alerts */
  router.post('/alerts/check', (req, res) => {
    try {
      const { summary, results, thresholds } = req.body;
      /* Compare current log statistics against threshold values */
      const alerts = checkAlerts(summary, results, thresholds);
      res.json({ success: true, alerts });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  /* === POST /api/export/csv === */
  /* Export grouped error results to CSV for external analysis */
  router.post('/export/csv', (req, res) => {
    const { results } = req.body;
    const csv = exportToCSV(results);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.csv');
    res.send(csv);
  });

  /* === POST /api/export/json === */
  /* Export grouped error results to JSON for programmatic use */
  router.post('/export/json', (req, res) => {
    const { results } = req.body;
    const json = exportToJSON(results);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.json');
    res.send(json);
  });

  /* === POST /api/export/pdf === */
  /* Generate PDF summary report with key statistics */
  router.post('/export/pdf', (req, res) => {
    try {
      const { summary, results } = req.body;
      /* Generate plain text summary, then render to PDF using jsPDF */
      const text = generatePDFSummary(summary, results);
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      /* Render each line at 5-unit vertical intervals */
      const lines = text.split('\n');
      lines.forEach((line, i) => doc.text(line, 10, 10 + i * 5));
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=aem-log-summary.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      /* Generic error message - PDF generation failures are often environment-related */
      res.json({ success: false, error: 'Failed to generate PDF' });
    }
  });

  return router;
}

/* === Module Exports === */
module.exports = createExportRouter;
