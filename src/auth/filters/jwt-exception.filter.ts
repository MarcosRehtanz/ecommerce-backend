import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

/**
 * Filter to handle JWT-related exceptions with specific error codes
 * This helps the frontend distinguish between different auth errors
 */
@Catch(UnauthorizedException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // Get the original error cause if available
    const cause = (exception as any).cause;
    const message = exception.message;

    let errorCode = 'UNAUTHORIZED';
    let errorMessage = message || 'No autorizado';

    // Check for specific JWT errors
    if (cause instanceof TokenExpiredError) {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'El token ha expirado';
    } else if (cause instanceof JsonWebTokenError) {
      errorCode = 'TOKEN_INVALID';
      errorMessage = 'Token inválido';
    } else if (message.includes('expirado') || message.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
    } else if (message.includes('inválido') || message.includes('invalid')) {
      errorCode = 'TOKEN_INVALID';
    } else if (message.includes('no encontrado') || message.includes('not found')) {
      errorCode = 'USER_NOT_FOUND';
    } else if (message.includes('desactivado') || message.includes('inactive')) {
      errorCode = 'USER_INACTIVE';
    } else if (message.includes('Sesion') || message.includes('session')) {
      errorCode = 'SESSION_INVALID';
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
