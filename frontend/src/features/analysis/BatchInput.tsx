import { useState } from 'react';
import { parseBatchInput } from './useAnalysis';

export function BatchInput() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<{ files: string[]; logTypes: string[] } | null>(null);

  const handleParse = () => {
    if (!input.trim()) return;
    setParsed(parseBatchInput(input));
  };

  return (
    <div className="batch-input">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="/path/to/log1.log, /path/to/log2.log"
        rows={5}
      />
      <button onClick={handleParse}>Parse</button>
      {parsed && (
        <div className="parsed-result">
          <p>Files: {parsed.files.length}</p>
          <ul>
            {parsed.files.map((f, i) => (
              <li key={i}>{f} ({parsed.logTypes[i]})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}