const { parentPort, workerData } = require('worker_threads');
const { analyzeAllInOnePass } = require('../services/errorLogService');
const { analyzeRequestLog } = require('../services/requestLogService');
const { analyzeCDNLog } = require('../services/cdnLogService');

async function run() {
  const onProgress = (payload) => {
    parentPort.postMessage({ type: 'progress', payload });
  };

  if (workerData.service === 'request') {
    const payload = await analyzeRequestLog(workerData.filePath, onProgress, { disableWorker: true });
    parentPort.postMessage({ type: 'result', payload });
    return;
  }

  if (workerData.service === 'cdn') {
    const payload = await analyzeCDNLog(workerData.filePath, onProgress, { disableWorker: true });
    parentPort.postMessage({ type: 'result', payload });
    return;
  }

  const payload = await analyzeAllInOnePass(workerData.filePath, onProgress, { disableWorker: true });
  parentPort.postMessage({ type: 'result', payload });
}

run().catch((error) => {
  throw error;
});
