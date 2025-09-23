import { TextEncoder, TextDecoder } from 'util';

// Polyfills Node env
(global as any).TextEncoder = TextEncoder as any;
(global as any).TextDecoder = TextDecoder as any;

// Jest fournit jest.fn(); on remplace fetch avant chaque test
beforeEach(() => {
  (global as any).fetch = jest.fn();
});

// --- Helpers pratiques pour les tests --- //
export function mockFetchOnceJson(payload: any, init: Partial<Response> = {}) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => payload,
  } as any);
}

export function mockFetchOnceError(status = 500, statusText = 'Internal Server Error') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    json: async () => ({}),
  } as any);
}

export function mockFetchOnceTimeout() {
  (global.fetch as jest.Mock).mockImplementationOnce(() => {
    const err: any = new Error('The operation was aborted');
    err.name = 'AbortError';
    return Promise.reject(err);
  });
}
