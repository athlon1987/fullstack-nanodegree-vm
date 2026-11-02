export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body, headers = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'You appear to be offline. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error?.code ?? 'error', data.error?.message ?? `Request failed (${res.status})`);
  }
  return { status: res.status, ...data };
}

export const api = {
  me: () => request('GET', '/api/me'),
  stats: () => request('GET', '/api/stats'),
  signup: (body) => request('POST', '/api/auth/signup', body),
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  logout: () => request('POST', '/api/auth/logout', {}),
  feed: (limit = 20) => request('GET', `/api/feed?limit=${limit}`),
  pass: (id) => request('POST', `/api/bills/${id}/pass`, {}),
  undoPass: (id) => request('DELETE', `/api/bills/${id}/pass`),
  pay: (id, idempotencyKey) => request('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': idempotencyKey }),
  history: () => request('GET', '/api/patron/history'),
  createBill: (body) => request('POST', '/api/bills', body),
  myBills: () => request('GET', '/api/bills/mine'),
  withdraw: (id) => request('POST', `/api/bills/${id}/withdraw`, {}),
  queue: () => request('GET', '/api/admin/queue'),
  approve: (id) => request('POST', `/api/admin/bills/${id}/approve`, {}),
  reject: (id, reason) => request('POST', `/api/admin/bills/${id}/reject`, { reason }),
};

/** Pay with one automatic retry on network failure, reusing the idempotency key so it can't double-charge. */
export async function payWithRetry(id, key) {
  try {
    return await api.pay(id, key);
  } catch (e) {
    if (e.code !== 'network') throw e;
    await new Promise((r) => setTimeout(r, 1200));
    return api.pay(id, key);
  }
}
