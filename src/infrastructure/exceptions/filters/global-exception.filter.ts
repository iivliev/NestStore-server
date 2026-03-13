/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GlobalExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse<Response>();
		const req = ctx.getRequest<Request>();

		// TypeORM errors
		if (exception instanceof EntityNotFoundError) {
			return res.status(HttpStatus.NOT_FOUND).json({
				statusCode: HttpStatus.NOT_FOUND,
				path: req.url,
				message: 'Entity not found',
			});
		}

		if (exception instanceof QueryFailedError) {
			const drv: any = (exception as any)?.driverError || {};
			const code = drv?.code;

			switch (code) {
				case '23505': // unique_violation
					return res.status(HttpStatus.CONFLICT).json({
						statusCode: HttpStatus.CONFLICT,
						path: req.url,
						message: 'Duplicate resource',
						meta: drv?.constraint ? { constraint: drv.constraint } : undefined,
					});

				case '23503': // foreign_key_violation
					return res.status(HttpStatus.BAD_REQUEST).json({
						statusCode: HttpStatus.BAD_REQUEST,
						path: req.url,
						message: 'Related entity missing',
					});

				case '23502': // not_null_violation
					return res.status(HttpStatus.BAD_REQUEST).json({
						statusCode: HttpStatus.BAD_REQUEST,
						path: req.url,
						message: 'A required field is missing',
					});

				case '40001': // serialization_failure
				case '40P01': // deadlock_detected
					return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
						statusCode: HttpStatus.SERVICE_UNAVAILABLE,
						path: req.url,
						message: 'Temporary database conflict. Please retry.',
						retryable: true,
					});
			}

			return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				path: req.url,
				message: 'Database query failed',
			});
		}

		// NestJS HttpException
		if (exception instanceof HttpException) {
			const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

			const response = exception.getResponse ? exception.getResponse() : exception.message;

			return res.status(status).json({
				statusCode: status,
				path: req.url,
				message: typeof response === 'string' ? response : (response as any).message || response,
			});
		}

		// Unknown / unhandled errors
		this.logger.error(`Unhandled exception for ${req.method} ${req.url}`, (exception as any)?.stack || exception);

		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			path: req.url,
			message: 'Internal server error',
		});
	}
}
