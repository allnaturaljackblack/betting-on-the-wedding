export default function FillBlank({ question, value, onChange, disabled }) {
  // Replace ___ in the prompt with an input, or just show a standalone input
  const prompt = question.prompt || ''
  const hasBlank = prompt.includes('___')

  if (hasBlank) {
    const parts = prompt.split('___')
    return (
      <div className="fill-blank-wrapper">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                className="fill-blank-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="your answer"
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p style={{ color: 'var(--cream-dim)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
        Fill in your answer:
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
      />
    </div>
  )
}
