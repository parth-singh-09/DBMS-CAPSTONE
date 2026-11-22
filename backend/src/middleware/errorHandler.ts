import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[API Error]:', err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      errorType: 'VALIDATION_ERROR',
      message: 'Validation failed on input data',
      errors: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // 2. MySQL Errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          success: false,
          errorType: 'DUPLICATE_KEY_ERROR',
          code: err.code,
          message: 'A record with this unique identifier already exists.',
          details: err.message,
        });

      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_NO_REFERENCED_ROW':
        return res.status(400).json({
          success: false,
          errorType: 'FOREIGN_KEY_NOT_FOUND',
          code: err.code,
          message: 'Referenced foreign record does not exist.',
          details: err.message,
        });

      case 'ER_ROW_IS_REFERENCED_2':
      case 'ER_ROW_IS_REFERENCED':
        return res.status(409).json({
          success: false,
          errorType: 'FOREIGN_KEY_RESTRICT',
          code: err.code,
          message: 'Cannot delete or modify record because other records depend on it.',
          details: err.message,
        });

      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        return res.status(400).json({
          success: false,
          errorType: 'CHECK_CONSTRAINT_VIOLATION',
          code: err.code,
          message: 'Database check constraint violated (e.g., negative stock, zero quantity, or invalid status).',
          details: err.message,
        });

      case 'ER_DATA_TOO_LONG':
        return res.status(400).json({
          success: false,
          errorType: 'DATA_TOO_LONG',
          code: err.code,
          message: 'Data provided exceeds maximum allowable column length.',
          details: err.message,
        });

      case 'ER_TABLEACCESS_DENIED_ERROR':
        return res.status(403).json({
          success: false,
          errorType: 'PERMISSION_DENIED',
          code: err.code,
          message: 'Access denied: User does not have permission to execute this operation.',
          details: err.message,
        });
    }
  }

  // 3. Known business / domain logic errors (insufficient stock, invalid FK, security violation)
  const isBusinessError =
    err.status === 400 ||
    err.message?.includes('Insufficient stock') ||
    err.message?.includes('does not exist') ||
    err.message?.includes('Security') ||
    err.message?.includes('prohibited');

  if (isBusinessError) {
    return res.status(err.status || 400).json({
      success: false,
      errorType: 'BUSINESS_LOGIC_ERROR',
      error: err.message,
      message: err.message,
    });
  }

  // 4. Fallback generic error
  return res.status(err.status || 500).json({
    success: false,
    errorType: 'INTERNAL_SERVER_ERROR',
    error: err.message || 'An unexpected internal server error occurred.',
    message: err.message || 'An unexpected internal server error occurred.',
  });
}
