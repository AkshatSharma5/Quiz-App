export async function requestGeminiText(prompt, responseMimeType = 'text/plain') {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, responseMimeType }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `AI request failed (${response.status}).`);
    error.code = payload.code || 'GEMINI_REQUEST_FAILED';
    throw error;
  }
  if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('AI returned an empty response.');
  return payload.text;
}
