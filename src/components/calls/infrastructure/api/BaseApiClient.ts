// src/components/calls/infrastructure/api/BaseApiClient.ts

export interface ApiResponse<T> {
  success: boolean;
  result?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metrics?: {
    processingTimeMs: number;
    estimatedCost: number;
  };
}

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Client API de base avec gestion d'erreurs, timeout et retry
 */
export abstract class BaseApiClient {
  protected baseUrl: string;
  protected defaultTimeout: number;
  protected defaultRetries: number;

  constructor(
    baseUrl: string = "",
    options: {
      timeout?: number;
      retries?: number;
    } = {}
  ) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = options.timeout || 30000; // 30 secondes
    this.defaultRetries = options.retries || 2;
  }

  /**
   * Méthode POST avec retry et gestion d'erreurs
   */
  protected async post<TRequest, TResponse>(
    endpoint: string,
    data: TRequest,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<TResponse>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = 1000,
      headers = {},
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(
          `🌐 [API Client] ${endpoint} - Attempt ${attempt}/${retries + 1}`
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = (await response.json()) as ApiResponse<TResponse>;

        console.log(
          `✅ [API Client] ${endpoint} - Success in ${attempt} attempt(s)`
        );
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        console.warn(
          `⚠️ [API Client] ${endpoint} - Attempt ${attempt} failed:`,
          lastError.message
        );

        if (attempt <= retries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ [API Client] Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué
    console.error(`❌ [API Client] ${endpoint} - All attempts failed`);

    return {
      success: false,
      error: {
        message: lastError?.message || "Request failed",
        code: this.getErrorCode(lastError),
        details: {
          attempts: retries + 1,
          endpoint,
          lastError: lastError?.message,
        },
      },
    };
  }

  /**
   * Méthode GET avec retry et gestion d'erreurs
   */
  protected async get<TResponse>(
    endpoint: string,
    params?: Record<string, any>,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<TResponse>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = 1000,
      headers = {},
    } = options;

    // Construction de l'URL avec paramètres
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(
          `🌐 [API Client] GET ${endpoint} - Attempt ${attempt}/${retries + 1}`
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = (await response.json()) as ApiResponse<TResponse>;

        console.log(`✅ [API Client] GET ${endpoint} - Success`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        console.warn(
          `⚠️ [API Client] GET ${endpoint} - Attempt ${attempt} failed:`,
          lastError.message
        );

        if (attempt <= retries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ [API Client] Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué
    console.error(`❌ [API Client] GET ${endpoint} - All attempts failed`);

    return {
      success: false,
      error: {
        message: lastError?.message || "Request failed",
        code: this.getErrorCode(lastError),
        details: {
          attempts: retries + 1,
          endpoint,
          lastError: lastError?.message,
        },
      },
    };
  }

  /**
   * Utilitaire pour délai d'attente
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extrait un code d'erreur de l'exception
   */
  private getErrorCode(error: Error | null): string {
    if (!error) return "UNKNOWN_ERROR";

    if (error.name === "AbortError") return "TIMEOUT";
    if (error.message.includes("Failed to fetch")) return "NETWORK_ERROR";
    if (error.message.includes("HTTP 4")) return "CLIENT_ERROR";
    if (error.message.includes("HTTP 5")) return "SERVER_ERROR";

    return "REQUEST_FAILED";
  }

  /**
   * Health check du service
   */
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 secondes max pour health check
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: "healthy",
          responseTime,
        };
      } else {
        return {
          status: "unhealthy",
          error: `HTTP ${response.status}`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      };
    }
  }
}
