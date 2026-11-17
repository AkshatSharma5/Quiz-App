import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/mcp.js';

function responseCapture() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(body = '') { this.body = body; },
  };
}

test('MCP HTTP endpoint lists tools without requiring learner data access', async () => {
  const res = responseCapture();
  await handler({ method: 'POST', body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } }, res);
  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.result.tools.length, 5);
});

test('MCP HTTP tool calls require a Firebase bearer token', async () => {
  const res = responseCapture();
  await handler({ method: 'POST', headers: {}, body: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'retrieve_attempt_history', arguments: { limit: 10 } } } }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(res.body).error.data.code, 'UNAUTHENTICATED');
});

test('MCP HTTP endpoint rejects methods other than POST', async () => {
  const res = responseCapture();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});
