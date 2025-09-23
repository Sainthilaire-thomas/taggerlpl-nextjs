// src/jest.setup.js
// Configuration globale pour Jest dans TaggerLPL

// Mocks d'env par défaut
process.env.OPENAI_API_KEY = "sk-test-mock-key-12345";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.TRANSCRIPTION_MAX_FILE_SIZE_MB = "100";
process.env.TRANSCRIPTION_TIMEOUT_MS = "300000";
process.env.TRANSCRIPTION_BATCH_SIZE = "5";

// Mock global fetch si pas dispo
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock File (Node)
if (!global.File) {
  global.File = class MockFile {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.type = options.type || "";
      const providedSize =
        typeof options.size === "number" ? options.size : undefined;
      this.size =
        providedSize ??
        (Array.isArray(bits)
          ? bits.reduce(
              (acc, bit) =>
                acc +
                (typeof bit === "string"
                  ? bit.length
                  : bit && typeof bit.size === "number"
                  ? bit.size
                  : 0),
              0
            )
          : 0);
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

// Mock Blob (Node)
if (!global.Blob) {
  global.Blob = class MockBlob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || "";
      this.size = parts.reduce(
        (acc, part) =>
          acc +
          (typeof part === "string"
            ? part.length
            : part && typeof part.size === "number"
            ? part.size
            : 0),
        0
      );
    }
  };
}

// Polyfill minimal pour Headers (utilisé dans les tests)
if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._map = new Map(
        Object.entries(init).map(([k, v]) => [
          String(k).toLowerCase(),
          String(v),
        ])
      );
    }
    get(name) {
      return this._map.get(String(name).toLowerCase()) ?? null;
    }
    set(name, value) {
      this._map.set(String(name).toLowerCase(), String(value));
    }
    has(name) {
      return this._map.has(String(name).toLowerCase());
    }
  };
}

// Mock AbortController pour les tests de timeout
if (!global.AbortController) {
  global.AbortController = class MockAbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Mock AbortSignal.timeout pour Node < 16
if (!global.AbortSignal?.timeout) {
  global.AbortSignal = {
    timeout: (delay) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), delay);
      return controller.signal;
    },
  };
}

// Restaure la console après chaque test
const originalConsole = { ...console };
afterEach(() => {
  Object.assign(console, originalConsole);
});

// Timeout global pour tests async
jest.setTimeout(30000);

// Mock window.crypto
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => "mock-uuid-" + Date.now(),
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  };
}

// Helpers utilitaires pour les tests
global.testUtils = {
  createMockFile: (name = "test.wav", size = 1024, type = "audio/wav") => {
    return new File(["mock audio data"], name, { type, size });
  },

  createMockBlob: (size = 1024, type = "audio/wav") => {
    return new Blob(["x".repeat(size)], { type });
  },

  // Réponse fetch minimaliste
  createMockResponse: (ok = true, data = {}) => ({
    ok,
    status: ok ? 200 : 404,
    statusText: ok ? "OK" : "Not Found",
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob(["mock data"])),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({
      "content-type": data.headers?.["content-type"] || "audio/wav",
      "content-length": data.headers?.["content-length"] || "1024",
      ...(data.headers || {}),
    }),
  }),

  mockWhisperResponse: (text = "Test transcription", duration = 5.0) => ({
    text,
    language: "fr",
    duration,
    segments: [
      {
        id: 0,
        start: 0.0,
        end: duration,
        text,
        words: text.split(" ").map((word, i, arr) => ({
          word,
          start: i * (duration / arr.length),
          end: (i + 1) * (duration / arr.length),
          probability: 0.95,
        })),
      },
    ],
  }),
};

// Matchers custom
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Logs de debug
console.log("🧪 Jest setup completed for TaggerLPL tests");
console.log("📝 Available test utilities:", Object.keys(global.testUtils));
