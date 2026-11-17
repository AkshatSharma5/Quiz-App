import { env } from 'node:process';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export async function generateGeminiText({ prompt, responseMimeType = 'text/plain', maxOutputTokens = 2048 }) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini is not configured on the server.');
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType, maxOutputTokens, temperature: 0.4 },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || `Gemini request failed (${response.status}).`);
    error.code = response.status === 429 ? 'GEMINI_RATE_LIMITED' : 'GEMINI_UPSTREAM_ERROR';
    error.status = response.status;
    throw error;
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) {
    const error = new Error('Gemini returned an empty response.');
    error.code = 'GEMINI_EMPTY_RESPONSE';
    throw error;
  }
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  }
  const { prompt, responseMimeType = 'text/plain' } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 24000 || !['text/plain', 'application/json'].includes(responseMimeType)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'A prompt up to 24,000 characters and a supported response type are required.' }));
  }
  try {
    const text = await generateGeminiText({ prompt, responseMimeType, maxOutputTokens: 2048 });
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ text, model: GEMINI_MODEL }));
  } catch (error) {
    res.statusCode = error.status === 429 ? 429 : error.code === 'GEMINI_NOT_CONFIGURED' ? 503 : 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: error.message, code: error.code || 'GEMINI_REQUEST_FAILED' }));
  }
}
