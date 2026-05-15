import type { AdvancedRule } from '../../types'

const FIELDS = [
  'message', 'logger', 'thread/pod', 'package', 'exception', 'category',
  'method', 'status', 'cache', 'country', 'pop', 'host',
  'responseTime', 'ttfb', 'ttlb', 'severity', 'sourceFile',
] as const

const OPERATORS = [
  'contains', 'equals', 'startsWith', 'endsWith', 'regex',
  'gt', 'gte', 'lt', 'lte', 'in',
] as const

interface AdvancedRulesBuilderProps {
  rules: AdvancedRule[]
  onChange: (rules: AdvancedRule[]) => void
}

export function AdvancedRulesBuilder({ rules, onChange }: AdvancedRulesBuilderProps) {
  const addRule = () => {
    onChange([...rules, { field: 'message', operator: 'contains', value: '' }])
  }

  const updateRule = (index: number, patch: Partial<AdvancedRule>) => {
    onChange(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index))
  }

  return (
    <div className="advanced-rules" data-testid="rules-container">
      <div className="rules-header">
        <h4>Advanced Search Rules</h4>
        <button data-testid="add-rule" onClick={addRule}>Add Rule</button>
        <button data-testid="clear-rules" onClick={() => onChange([])}>Clear Rules</button>
      </div>

      {rules.length === 0 ? (
        <p className="rules-empty">Add rules to refine your search.</p>
      ) : (
        <div className="rules-list">
          {rules.map((rule, i) => (
            <div key={i} className="rule-row">
              <select value={rule.field} onChange={(e) => updateRule(i, { field: e.target.value })}>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select value={rule.operator} onChange={(e) => updateRule(i, { operator: e.target.value as AdvancedRule['operator'] })}>
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(i, { value: e.target.value })}
                placeholder="Value"
              />
              <button className="remove-rule" onClick={() => removeRule(i)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <button data-testid="run-rules" className="run-rules-btn">Run</button>
      )}
    </div>
  )
}
