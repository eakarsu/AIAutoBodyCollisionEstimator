import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function AIResultDisplay({ result, loading }) {
  if (loading) {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        AI is analyzing... This may take a moment.
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <span className="ai-badge">AI Analysis</span>
        <span className="model-info">Model: {result.model || 'AI'}</span>
        {result.usage && (
          <span className="model-info">
            Tokens: {result.usage.prompt_tokens + result.usage.completion_tokens}
          </span>
        )}
      </div>
      <div className="ai-result-content">
        {result.error ? (
          <div className="alert alert-error">{result.content}</div>
        ) : (
          <ReactMarkdown>{result.content}</ReactMarkdown>
        )}
      </div>
    </div>
  )
}
