const { expect } = require('@playwright/test');

async function awaitAnalysisComplete(page, options = {}) {
  const { timeout = 30000 } = options;

  const timeoutMs = Date.now() + timeout;
  
  while (Date.now() < timeoutMs) {
    const errorToast = await page.locator('.toast.error').isVisible().catch(() => false);
    if (errorToast) {
      const errorText = await page.locator('.toast.error').textContent();
      throw new Error(`Analysis failed: ${errorText}`);
    }

    const progressHidden = await page.locator('#progressText').evaluate(el => el.classList.contains('hidden')).catch(() => true);
    const workspaceVisible = await page.locator('#resultWorkspace').evaluate(el => !el.classList.contains('hidden')).catch(() => false);

    if (progressHidden && workspaceVisible) {
      return true;
    }

    await page.waitForTimeout(500);
  }

  const errorToast = await page.locator('.toast.error').isVisible().catch(() => false);
  if (errorToast) {
    const errorText = await page.locator('.toast.error').textContent();
    throw new Error(`Analysis failed: ${errorText}`);
  }

  throw new Error('Analysis did not complete within timeout');
}

async function awaitFilterApply(page, options = {}) {
  const { timeout = 15000 } = options;

  const timeoutMs = Date.now() + timeout;
  
  while (Date.now() < timeoutMs) {
    const errorToast = await page.locator('.toast.error').isVisible().catch(() => false);
    if (errorToast) {
      const errorText = await page.locator('.toast.error').textContent();
      throw new Error(`Filter failed: ${errorText}`);
    }

    const progressHidden = await page.locator('#progressText').evaluate(el => el.classList.contains('hidden')).catch(() => true);
    if (progressHidden) {
      // Check if it still has a loading message in rawEvents
      const isLoading = await page.evaluate(() => {
        const rawEvents = document.getElementById('rawEvents');
        return !rawEvents || rawEvents.textContent.includes('Loading');
      });
      
      if (!isLoading) return true;
    }

    await page.waitForTimeout(500);
  }

  throw new Error('Filter did not apply within timeout');
}

function getSummaryCounts(page) {
  return page.evaluate(() => {
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.textContent.trim() : null;
    };

    const getCount = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const text = el.textContent;
      const match = text.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    };

    const getLevelCount = (level) => {
      const el = document.getElementById(`count${level}`);
      if (!el) return null;
      const text = el.textContent.replace(/[()]/g, '').trim();
      return parseInt(text, 10) || 0;
    };

    return {
      totalErrors: getLevelCount('ERROR'),
      totalWarnings: getLevelCount('WARN'),
      uniqueErrors: getLevelCount('ALL') ? getLevelCount('ERROR') + getLevelCount('WARN') : null,
      totalRequests: getLevelCount('ALL') || getCount('#totalRequests'),
      avgLatency: getCount('#avgLatency'),
      cacheHitRatio: getCount('#cacheHitRatio'),
      logType: document.querySelector('.log-type-badge')?.textContent || null
    };
  });
}

async function waitForRawEventsLoaded(page, options = {}) {
  const { timeout = 10000 } = options;

  await page.waitForSelector('#rawEvents', { state: 'visible', timeout });
  
  await page.waitForFunction(() => {
    const rawEvents = document.getElementById('rawEvents');
    return rawEvents && rawEvents.children.length > 0;
  }, { timeout });

  return true;
}

async function getRawEventsData(page) {
  return page.evaluate(() => {
    const container = document.getElementById('rawEvents');
    if (!container) return [];
    
    const events = container.querySelectorAll('.raw-event, tr');
    const data = [];
    
    events.forEach(item => {
      const text = item.textContent || '';
      const timestampMatch = text.match(/\d{2}\.\d{2}\.\d{4}/);
      const levelMatch = text.match(/\*(ERROR|WARN|INFO|DEBUG)\*/);
      
      data.push({
        timestamp: timestampMatch ? timestampMatch[0] : '',
        level: levelMatch ? levelMatch[1] : '',
        message: text.substring(0, 100),
        logger: text.match(/\[(.*?)\]/)?.[1] || '',
        thread: text.match(/\[thread-\d+\]/)?.[0] || ''
      });
    });
    
    return data;
  });
}

async function applyFilterAndWait(page, filterType, value) {
  const filterMap = {
    logger: '#loggerFilter',
    thread: '#threadFilter',
    exception: '#exceptionFilter',
    search: '#searchInput'
  };

  const selector = filterMap[filterType];
  if (!selector) {
    throw new Error(`Unknown filter type: ${filterType}`);
  }

  await page.locator(selector).fill(value);
  await page.locator('#applyFiltersBtn').click();
  
  return awaitFilterApply(page);
}

async function clearAllFilters(page) {
  await page.locator('#clearFiltersBtn').click();
  await page.waitForTimeout(500);
}

async function getPaginationInfo(page) {
  return page.evaluate(() => {
    const summaryEl = document.querySelector('.pagination-info, #paginationSummary');
    const text = summaryEl ? summaryEl.textContent : '';
    
    const pageMatch = text.match(/page\s*(\d+)/i);
    const totalMatch = text.match(/of\s*(\d+)/i);
    const perPageMatch = text.match(/(\d+)\s*per\s*page/i);
    
    return {
      currentPage: pageMatch ? parseInt(pageMatch[1], 10) : 1,
      totalPages: totalMatch ? parseInt(totalMatch[1], 10) : 1,
      perPage: perPageMatch ? parseInt(perPageMatch[1], 10) : 20,
      summaryText: text
    };
  });
}

async function navigateToPage(page, pageNum) {
  const pageButton = page.locator(`.pagination button[data-page="${pageNum}"]`);
  if (await pageButton.isVisible()) {
    await pageButton.click();
    await page.waitForTimeout(500);
  }
}

async function getLogType(page) {
  return page.evaluate(() => {
    const badge = document.querySelector('.log-type-badge');
    return badge ? badge.textContent.trim().toLowerCase() : null;
  });
}

async function getLevelCounts(page) {
  return page.evaluate(() => {
    return {
      ERROR: parseInt(document.getElementById('countERROR')?.textContent || '0', 10),
      WARN: parseInt(document.getElementById('countWARN')?.textContent || '0', 10),
      INFO: parseInt(document.getElementById('countINFO')?.textContent || '0', 10),
      DEBUG: parseInt(document.getElementById('countDEBUG')?.textContent || '0', 10),
      ALL: parseInt(document.getElementById('countALL')?.textContent || '0', 10)
    };
  });
}

async function isResultsPanelVisible(page) {
  const panel = page.locator('#resultsPanel');
  return await panel.isVisible();
}

module.exports = {
  awaitAnalysisComplete,
  awaitFilterApply,
  getSummaryCounts,
  getLevelCounts,
  waitForRawEventsLoaded,
  getRawEventsData,
  applyFilterAndWait,
  clearAllFilters,
  getPaginationInfo,
  navigateToPage,
  getLogType,
  isResultsPanelVisible
};
