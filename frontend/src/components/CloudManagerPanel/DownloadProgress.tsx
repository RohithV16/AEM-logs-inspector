interface DownloadProgressProps {
  files: { file: string; status: 'pending' | 'progress' | 'done' }[]
}

export function DownloadProgress({ files }: DownloadProgressProps) {
  return (
    <div className="cm-download-progress-panel" data-testid="download-progress">
      <h4>Download Progress</h4>
      {files.map((f) => (
        <div key={f.file} className="cm-download-progress-item">
          <span className={`cm-download-progress-icon ${f.status}`}>
            {f.status === 'done' ? '\u2713' : f.status === 'progress' ? '\u23F3' : '\u25CB'}
          </span>
          <span className="cm-download-progress-item-name">{f.file}</span>
        </div>
      ))}
    </div>
  )
}
