import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class HttpClient {
  async solicitar(
    variable: 'EJEMPLARES_SERVICE_URL' | 'PERSONAS_SERVICE_URL',
    ruta: string,
    metodo: 'GET' | 'POST' | 'PATCH',
    mensajeNoEncontrado: string,
    cuerpo?: object,
  ): Promise<unknown> {
    const baseUrl = process.env[variable];
    if (!baseUrl) {
      throw new ServiceUnavailableException(`Falta ${variable}`);
    }

    let respuesta: Response;
    try {
      const url = new URL(`${baseUrl.replace(/\/+$/, '')}${ruta}`);
      const options: RequestInit = {
        method: metodo,
        signal: AbortSignal.timeout(3000),
      };
      if (metodo !== 'GET') {
        options.headers = { 'content-type': 'application/json' };
        options.body = JSON.stringify(cuerpo ?? {});
      }
      respuesta = await fetch(url, options);
    } catch {
      throw new ServiceUnavailableException(`No responde ${variable}`);
    }

    if (respuesta.status === 404) {
      throw new NotFoundException(mensajeNoEncontrado);
    }
    if (!respuesta.ok) {
      throw new ServiceUnavailableException(`Respuesta fallida de ${variable}`);
    }

    try {
      return (await respuesta.json()) as unknown;
    } catch {
      throw new ServiceUnavailableException(
        `Respuesta inválida de ${variable}`,
      );
    }
  }
}
