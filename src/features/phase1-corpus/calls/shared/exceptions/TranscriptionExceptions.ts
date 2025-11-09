export class TranscriptionError extends Error {
  code: string;
  cause?: Error;
  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = "TranscriptionError";
    this.code = code;
    if (cause) this.cause = cause;
  }
}
