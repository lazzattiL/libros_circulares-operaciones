import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { integerId } from '../shared/validation';
import { HttpClient } from './http.client';

@Injectable()
export class PersonasClient {
  constructor(private readonly http: HttpClient) {}

  async verificarUsuario(usuarioId: number): Promise<void> {
    const data = await this.http.solicitar(
      'PERSONAS_SERVICE_URL',
      '/usuario/consulta',
      'POST',
      'El usuario no existe',
      { usuarioId },
    );
    if (
      data === null ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      (data as Record<string, unknown>).usuarioId !== usuarioId
    ) {
      throw new ServiceUnavailableException(
        'Gestión de personas devolvió un usuario inválido',
      );
    }
  }

  async miembros(comunidadId: number): Promise<number[]> {
    const data = await this.http.solicitar(
      'PERSONAS_SERVICE_URL',
      '/comunidad/miembros/consulta',
      'POST',
      'La comunidad no existe',
      { comunidadId },
    );
    if (!Array.isArray(data)) {
      throw new ServiceUnavailableException(
        'Gestión de personas devolvió miembros inválidos',
      );
    }
    try {
      return data.map((usuario: unknown) => {
        if (
          usuario === null ||
          typeof usuario !== 'object' ||
          Array.isArray(usuario)
        ) {
          throw new Error('Usuario inválido');
        }
        return integerId(
          (usuario as Record<string, unknown>).usuarioId,
          'usuarioId',
        );
      });
    } catch {
      throw new ServiceUnavailableException(
        'Gestión de personas devolvió miembros inválidos',
      );
    }
  }
}
