const https = require('https');

function getModel() {
  return process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
}

async function queryOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = getModel();

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return { error: false, content: 'OpenRouter API key not configured. Please add your key to the .env file.', model, raw: null };
  }

  const body = JSON.stringify({
    model,
    messages,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.3,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Auto Body Estimator',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            resolve({ error: true, content: parsed.error.message || 'AI service error', model, raw: parsed });
          } else {
            const content = parsed.choices?.[0]?.message?.content || 'No response from AI';
            resolve({
              error: false,
              content,
              model: parsed.model || model,
              usage: parsed.usage,
              raw: parsed,
            });
          }
        } catch (e) {
          resolve({ error: true, content: 'Failed to parse AI response', model, raw: data });
        }
      });
    });
    req.on('error', (e) => resolve({ error: true, content: e.message, model, raw: null }));
    req.write(body);
    req.end();
  });
}

/**
 * 3-strategy JSON parser:
 *  1) parse the raw response directly
 *  2) strip ```json fences and parse the inner block
 *  3) regex-extract the first {...} or [...] block and parse that
 */
function parseAIJson(content) {
  if (!content || typeof content !== 'string') {
    return { ok: false, raw: content };
  }
  try {
    return { ok: true, data: JSON.parse(content) };
  } catch (_) {}
  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch && fenceMatch[1]) {
    try { return { ok: true, data: JSON.parse(fenceMatch[1].trim()) }; } catch (_) {}
  }
  const blockMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (blockMatch && blockMatch[1]) {
    try { return { ok: true, data: JSON.parse(blockMatch[1]) }; } catch (_) {}
  }
  return { ok: false, raw: content };
}

module.exports = { queryOpenRouter, parseAIJson, getModel };
