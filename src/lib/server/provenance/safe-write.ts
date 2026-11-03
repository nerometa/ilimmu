export class WriteError extends Error {
  constructor(
    readonly status: 404 | 409 | 422,
    readonly code: 'NOT_FOUND' | 'STALE_REVISION' | 'INVALID_SUBJECT',
    message: string
  ) {
    super(message);
    this.name = 'WriteError';
  }
}

export function changed<T>(row: T | undefined): T {
  if (row === undefined) {
    throw new WriteError(409, 'STALE_REVISION', 'This record changed. Reload and review before saving.');
  }
  return row;
}

export function present<T>(row: T | undefined): T {
  if (row === undefined) throw new WriteError(404, 'NOT_FOUND', 'Record not found.');
  return row;
}
