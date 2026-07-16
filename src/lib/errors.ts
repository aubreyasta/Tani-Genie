export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} dengan id "${id}" tidak ditemukan`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    readonly fieldErrors: ReadonlyArray<{ readonly field: string; readonly message: string }>,
  ) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, 'BAD_REQUEST', 400);
    this.name = 'BadRequestError';
  }
}
