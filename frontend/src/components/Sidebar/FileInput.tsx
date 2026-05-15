import { useState } from 'react'
import { validateFilePath, parseBatchInput } from '../../utils/files'

export function FileInput() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
  }

  const handleAnalyze = () => {
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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  return (
    <div className="file-input-panel">
      <input
        id="filePathInput"
        data-testid="file-path-input"
        type="text"
        className="file-input"
        placeholder="Enter file path(s), comma or newline separated"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {error && <div className="file-input-error">{error}</div>}
      <button
        data-testid="analyze-btn"
        className="analyze-btn"
        onClick={handleAnalyze}
      >
        Analyze
      </button>
    </div>
  )
}
