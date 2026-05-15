import { useState } from 'react'
import { CommandPreview } from './CommandPreview'
import { DownloadProgress } from './DownloadProgress'

export function CloudManagerDownload() {
  const [program, setProgram] = useState('')
  const [environment, setEnvironment] = useState('')
  const [tier, setTier] = useState<'author' | 'publish' | 'dispatcher'>('author')
  const [days, setDays] = useState(1)
  const [outputDir, setOutputDir] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState<{ file: string; status: 'pending' | 'progress' | 'done' }[]>([])

  const handleDownload = () => {
    setDownloading(true)
    setProgress([
      { file: 'error.log', status: 'progress' },
      { file: 'request.log', status: 'pending' },
    ])
    setTimeout(() => {
      setProgress((p) =>
        p.map((f) => (f.status === 'progress' ? { ...f, status: 'done' as const } : f)),
      )
    }, 2000)
  }

  return (
    <div className="cm-download" data-testid="cm-download">
      <div className="cm-field">
        <label>Program</label>
        <select value={program} onChange={(e) => setProgram(e.target.value)} data-testid="cm-program">
          <option value="">Select program...</option>
          <option value="program1">Program 1</option>
        </select>
      </div>
      <div className="cm-field">
        <label>Environment</label>
        <select value={environment} onChange={(e) => setEnvironment(e.target.value)} data-testid="cm-environment">
          <option value="">Select environment...</option>
          <option value="dev">dev</option>
          <option value="stage">stage</option>
          <option value="prod">prod</option>
        </select>
      </div>
      <div className="cm-field">
        <label>Tier</label>
        <div className="tier-tabs">
          {(['author', 'publish', 'dispatcher'] as const).map((t) => (
            <button
              key={t}
              className={`tier-tab ${tier === t ? 'active' : ''}`}
              onClick={() => setTier(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="cm-field">
        <label>Days: {days}</label>
        <input type="range" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </div>
      <div className="cm-field">
        <label>Output directory</label>
        <input type="text" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} placeholder="/path/to/logs" />
      </div>
      <CommandPreview program={program} environment={environment} tier={tier} />
      <button
        className="cm-download-btn"
        onClick={handleDownload}
        disabled={!program || !environment}
        data-testid="cm-download-btn"
      >
        Download Selected Logs
      </button>
      {downloading && <DownloadProgress files={progress} />}
    </div>
  )
}
