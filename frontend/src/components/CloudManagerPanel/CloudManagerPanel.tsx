import { useState } from 'react'
import { CloudManagerDownload } from './CloudManagerDownload'
import { CloudManagerHistory } from './CloudManagerHistory'

export function CloudManagerPanel() {
  const [tab, setTab] = useState<'download' | 'history'>('download')

  return (
    <div className="cm-panel">
      <div className="cm-tabs">
        <button
          className={`cm-tab ${tab === 'download' ? 'active' : ''}`}
          onClick={() => setTab('download')}
        >
          Download
        </button>
        <button
          className={`cm-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>
      {tab === 'download' ? <CloudManagerDownload /> : <CloudManagerHistory />}
    </div>
  )
}
