const express = require('express');
const path = require('path');
const fs = require('fs');
const { analyzeLogFile, getSummary, filterByDateRange, filterByLogger, filterByThread, filterByRegex, exportToCSV, exportToJSON, generatePDFSummary, getTimelineData, getLoggerDistribution, normalizeMessage } = require('./analyzer');
const { parseLogFile } = require('./parser');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.static('public'));

app.post('/api/analyze', (req, res) => {
  const { filePath, fileContent } = req.body;
  
  try {
    let summary, results;
    
    if (fileContent) {
      const lines = fileContent.split('\n');
      const tempFile = path.join(__dirname, '..', 'temp-' + Date.now() + '.log');
      fs.writeFileSync(tempFile, fileContent);
      
      summary = getSummary(tempFile);
      results = analyzeLogFile(tempFile);
      
      fs.unlinkSync(tempFile);
    } else if (filePath) {
      summary = getSummary(filePath);
      results = analyzeLogFile(filePath);
    } else {
      throw new Error('No file path or content provided');
    }
    
    res.json({ success: true, summary, results });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/filter', (req, res) => {
  const { filePath, fileContent, filters } = req.body;
  
  try {
    let entries;
    let tempFile = null;
    
    if (fileContent) {
      tempFile = path.join(__dirname, '..', 'temp-' + Date.now() + '.log');
      fs.writeFileSync(tempFile, fileContent);
      entries = parseLogFile(tempFile);
    } else if (filePath) {
      entries = parseLogFile(filePath);
    } else {
      throw new Error('No file path or content provided');
    }
    
    if (filters) {
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        entries = filterByDateRange(entries, start, end);
      }
      if (filters.logger) entries = filterByLogger(entries, filters.logger);
      if (filters.thread) entries = filterByThread(entries, filters.thread);
      if (filters.regex) entries = filterByRegex(entries, filters.regex);
    }
    
    const results = analyzeEntries(entries);
    const summary = getSummaryFromEntries(entries);
    const timeline = getTimelineData(entries);
    const loggerDist = getLoggerDistribution(entries);
    
    if (tempFile) fs.unlinkSync(tempFile);
    
    res.json({ success: true, summary, results, timeline, loggerDist });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/export/csv', (req, res) => {
  const { results } = req.body;
  const csv = exportToCSV(results);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.csv');
  res.send(csv);
});

app.post('/api/export/json', (req, res) => {
  const { results } = req.body;
  const json = exportToJSON(results);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=aem-log-errors.json');
  res.send(json);
});

app.post('/api/export/pdf', (req, res) => {
  const { summary, results } = req.body;
  const text = generatePDFSummary(summary, results);
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();
  const lines = text.split('\n');
  lines.forEach((line, i) => doc.text(line, 10, 10 + i * 5));
  doc.save('aem-log-summary.pdf');
  res.json({ success: true });
});

function analyzeEntries(entries) {
  const grouped = {};
  for (const entry of entries) {
    const normalized = normalizeMessage(entry.message);
    const key = `${entry.level}:${normalized}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        level: entry.level,
        message: normalized,
        count: 0,
        firstOccurrence: entry.timestamp,
        examples: []
      };
    }
    
    grouped[key].count++;
    if (grouped[key].examples.length < 3) {
      grouped[key].examples.push({
        timestamp: entry.timestamp,
        logger: entry.logger,
        thread: entry.thread
      });
    }
  }
  
  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

function getSummaryFromEntries(entries) {
  return {
    totalErrors: entries.filter(e => e.level === 'ERROR').length,
    totalWarnings: entries.filter(e => e.level === 'WARN').length,
    uniqueErrors: new Set(entries.filter(e => e.level === 'ERROR').map(e => normalizeMessage(e.message))).size,
    uniqueWarnings: new Set(entries.filter(e => e.level === 'WARN').map(e => normalizeMessage(e.message))).size,
    totalLines: entries.length
  };
}

app.listen(PORT, () => {
  console.log(`AEM Log Analyzer Dashboard`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`\nUsage:`);
  console.log(`1. Click "Select Log File"`);
  console.log(`2. Navigate to your log file`);
  console.log(`3. View analyzed errors and warnings\n`);
});
