import { useState, useRef, useEffect } from 'react'
import { CommandPreview } from './CommandPreview'
import { DownloadProgress } from './DownloadProgress'

interface DownloadFile {
  file: string
  status: 'pending' | 'progress' | 'done' | 'error'
}

export function CloudManagerDownload() {
  const [program, setProgram] = useState('')
  const [environment, setEnvironment] = useState('')
  const [tier, setTier] = useState<'author' | 'publish' | 'dispatcher'>('author')
  const [days, setDays] = useState(1)
  const [outputDir, setOutputDir] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadFile[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  const handleDownload = () => {
    setDownloading(true)
    setProgress([])

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = import.meta.env.VITE_WS_URL || (protocol + '//' + host)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'cloudmanager-download',
        options: { program, environment, tier, days, outputDirectory: outputDir }
      }))
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)

        if (msg.type === 'progress' && msg.file && msg.status) {
          setProgress((prev) => {
            const existing = prev.find((f) => f.file === msg.file)
            if (existing) {
              return prev.map((f) => f.file === msg.file ? { file: f.file, status: msg.status } : f)
            }
            return [...prev, { file: msg.file, status: msg.status }]
          })
        }

        if (msg.type === 'complete' || (msg.type === 'error' && msg.status === 'error')) {
          ws.close()
          wsRef.current = null
          setDownloading(false)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      ws.close()
      wsRef.current = null
      setDownloading(false)
    }
  }

  return (
    <div className="cm-download" data-testid="cm-download">
      <div className="cloudmanager-field">
        <label>Program</label>
        <select value={program} onChange={(e) => setProgram(e.target.value)} data-testid="cm-program">
          <option value="">Select program...</option>
          <option value="program1">Program 1</option>
        </select>
      </div>
      <div className="cloudmanager-field">
        <label>Environment</label>
        <select value={environment} onChange={(e) => setEnvironment(e.target.value)} data-testid="cm-environment">
          <option value="">Select environment...</option>
          <option value="dev">dev</option>
          <option value="stage">stage</option>
          <option value="prod">prod</option>
        </select>
      </div>
      <div className="cloudmanager-field">
        <label>Tier</label>
        <div className="cloudmanager-tier-tabs">
          {(['author', 'publish', 'dispatcher'] as const).map((t) => (
            <button
              key={t}
              className={`cloudmanager-tier-tab ${tier === t ? 'active' : ''}`}
              onClick={() => setTier(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="cloudmanager-field">
        <label>Days: {days}</label>
        <input type="range" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </div>
      <div className="cloudmanager-field">
        <label>Output directory</label>
        <input type="text" value={outputDir} onChange={(e) => setOutputDir(e.target.value)} placeholder="/path/to/logs" />
      </div>
      <CommandPreview program={program} environment={environment} tier={tier} />
      <button
        className="upload-btn"
        onClick={handleDownload}
        disabled={!program || !environment || downloading}
        data-testid="cm-download-btn"
      >
        {downloading ? 'Downloading...' : 'Download Selected Logs'}
      </button>
      {downloading && <DownloadProgress files={progress} />}
    </div>
  )
}
