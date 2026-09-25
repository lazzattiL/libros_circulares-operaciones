import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';

export function bodyObject(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) {
    throw new BadRequestException('Falta el cuerpo de la solicitud');
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new UnprocessableEntityException('El cuerpo debe ser un objeto JSON');
  }
  return value as Record<string, unknown>;
}

export function required(
  body: Record<string, unknown>,
  field: string,
): unknown {
  if (body[field] === undefined || body[field] === null) {
    throw new BadRequestException(`Falta ${field}`);
  }
  return body[field];
}

export function ejemplarId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new UnprocessableEntityException(
      'ejemplarId debe ser un número positivo',
    );
  }
  return value;
}

export function integerId(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new UnprocessableEntityException(
      `${field} debe ser un entero positivo`,
    );
  }
  return value;
}
