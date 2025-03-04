import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export const validationPipeConfig = new ValidationPipe({
  exceptionFactory: (errors: ValidationError[]) => {
    const firstError = errors[0];

    const errorMessage = firstError.constraints
      ? Object.values(firstError.constraints)[0]
      : 'Validation error';

    const formattedError = {
      message: errorMessage,
      error: 'Bad Request',
      statusCode: 400,
    };

    return new BadRequestException(formattedError);
  },
  whitelist: true,
  forbidNonWhitelisted: true,
});
