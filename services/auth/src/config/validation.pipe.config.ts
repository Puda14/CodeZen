import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export const validationPipeConfig = new ValidationPipe({
  exceptionFactory: (errors: ValidationError[]) => {
    const allErrors = extractAllErrors(errors);

    const firstError = allErrors.length > 0 ? allErrors[0] : null;

    const errorMessage = firstError
      ? firstError.message
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
  transform: true,
});

function extractAllErrors(errors: ValidationError[], parentPath = ''): Array<{ path: string; message: string }> {
  let result: Array<{ path: string; message: string }> = [];

  errors.forEach(error => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      const messages = Object.values(error.constraints);
      messages.forEach(message => {
        result.push({
          path,
          message: `${path}: ${message}`
        });
      });
    }

    if (error.children && error.children.length > 0) {
      const nestedErrors = extractAllErrors(error.children, path);
      result = [...result, ...nestedErrors];
    }
  });

  return result;
}
