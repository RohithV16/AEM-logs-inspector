import { useState } from 'react'
import { validateFilePath, parseBatchInput } from '../../utils/files'
import { useLogContext } from '../../context/LogContext'

function toArray(obj: Record<string, number> | undefined | { name: string; count: number }[]): { name: string; count: number }[] {
  if (!obj) return []
  if (Array.isArray(obj)) return obj
  return Object.entries(obj).map(([name, count]) => ({ name, count }))
}

export function FileInput() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setFilePath, setFilterMeta, setLevelCounts } = useLogContext()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
  }

  const handleAnalyze = async () => {
    const filePaths = parseBatchInput(value)
    if (filePaths.length === 0) {
      setError('Enter at least one file path')
      return
    }
    for (const fp of filePaths) {
      const result = validateFilePath(fp)
      if (!result.valid) {
        setError(result.error || null)
        return
      }
    }
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: filePaths[0] }),
      })
      const data = await res.json()
      if (data.success) {
        setFilePath(filePaths[0])
        setFilterMeta({
          packages: toArray(data.packages),
          loggers: toArray(data.loggers),
          threads: toArray(data.threads),
          exceptions: toArray(data.exceptions),
          categories: toArray(data.categories),
          packageThreads: data.packageThreads || {},
          packageExceptions: data.packageExceptions || {},
          packageLoggers: data.packageLoggers || {},
          loggerThreads: data.loggerThreads || {},
          loggerExceptions: data.loggerExceptions || {},
          loggerPackages: data.loggerPackages || {},
          threadPackages: data.threadPackages || {},
          threadLoggers: data.threadLoggers || {},
          threadExceptions: data.threadExceptions || {},
          exceptionPackages: data.exceptionPackages || {},
          exceptionLoggers: data.exceptionLoggers || {},
          exceptionThreads: data.exceptionThreads || {},
        })
        if (data.levelCounts) {
          setLevelCounts(data.levelCounts)
        }
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Network error during analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  return (
    <div className="source-panel">
      <div className="upload-row">
        <input
          id="filePathInput"
          data-testid="file-path-input"
          type="text"
          className="upload-input compact"
          placeholder="Enter file path(s), comma or newline separated"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {error && <div className="file-input-error" style={{ color: 'var(--color-error)' }}>{error}</div>}
        <button
          data-testid="analyze-btn"
          className="btn-apply"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </div>
  )
}
