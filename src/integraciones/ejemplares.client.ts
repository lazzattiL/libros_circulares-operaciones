import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { integerId } from '../shared/validation';
import { HttpClient } from './http.client';

export type EjemplarRemoto = { id: number; duenioId: number };

@Injectable()
export class EjemplaresClient {
  constructor(private readonly http: HttpClient) {}

  async consultar(ejemplarId: number): Promise<EjemplarRemoto> {
    const data = await this.http.solicitar(
      'EJEMPLARES_SERVICE_URL',
      `/ejemplar/${ejemplarId}`,
      'GET',
      'El ejemplar no existe',
    );
    return this.validar(data, ejemplarId);
  }

  async cambiarDuenio(
    ejemplarId: number,
    nuevoDuenioId: number,
  ): Promise<void> {
    const data = await this.http.solicitar(
      'EJEMPLARES_SERVICE_URL',
      `/ejemplar/${ejemplarId}`,
      'PATCH',
      'El ejemplar no existe',
      { duenioId: nuevoDuenioId },
    );
    const ejemplar = this.validar(data, ejemplarId);
    if (ejemplar.duenioId !== nuevoDuenioId) {
      throw new ServiceUnavailableException(
        'Gestión de ejemplares no confirmó el cambio de dueño',
      );
    }
  }

  private validar(value: unknown, ejemplarId: number): EjemplarRemoto {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new ServiceUnavailableException(
        'Respuesta inválida de gestión de ejemplares',
      );
    }
    const data = value as Record<string, unknown>;
    if (data.id !== ejemplarId) {
      throw new ServiceUnavailableException(
        'Gestión de ejemplares devolvió otro ejemplar',
      );
    }
    try {
      integerId(data.duenioId, 'duenioId');
    } catch {
      throw new ServiceUnavailableException(
        'Gestión de ejemplares devolvió un dueño inválido',
      );
    }
    return { id: ejemplarId, duenioId: data.duenioId as number };
  }
}
