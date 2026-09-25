import { Injectable } from '@nestjs/common';
import { Operacion, TipoOperacion } from './operacion.entity';

type DatosOperacion = Pick<
  Operacion,
  'ejemplarId' | 'poseedorId' | 'activo' | 'comunidadId'
>;

@Injectable()
export class OperacionesStore {
  private readonly operaciones: Operacion[] = [];
  private readonly pendientes = new Map<number, Promise<void>>();
  private siguienteId = 1;

  listar(): Operacion[] {
    return [...this.operaciones];
  }

  ultima(ejemplarId: number): Operacion | undefined {
    return this.operaciones
      .filter((operacion) => operacion.ejemplarId === ejemplarId)
      .reduce<Operacion | undefined>((ultima, actual) => {
        if (!ultima) return actual;
        const diferencia =
          actual.fechaHora.getTime() - ultima.fechaHora.getTime();
        return diferencia > 0 || (diferencia === 0 && actual.id > ultima.id)
          ? actual
          : ultima;
      }, undefined);
  }

  registrar(
    tipo: TipoOperacion,
    anterior: Operacion | undefined,
    datos: DatosOperacion,
  ): Operacion {
    const operacion = new Operacion();
    operacion.id = this.siguienteId++;
    operacion.operacionAsociadaId = anterior?.id ?? null;
    operacion.tipo = tipo;
    operacion.ejemplarId = datos.ejemplarId;
    operacion.poseedorId = datos.poseedorId;
    operacion.activo = datos.activo;
    operacion.fechaHora = new Date();
    operacion.comunidadId = datos.comunidadId;
    this.operaciones.push(operacion);
    return operacion;
  }

  async serializar<T>(
    ejemplarId: number,
    accion: () => Promise<T>,
  ): Promise<T> {
    const anterior = this.pendientes.get(ejemplarId) ?? Promise.resolve();
    let liberar!: () => void;
    const actual = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    this.pendientes.set(ejemplarId, actual);
    await anterior;
    try {
      return await accion();
    } finally {
      liberar();
      if (this.pendientes.get(ejemplarId) === actual) {
        this.pendientes.delete(ejemplarId);
      }
    }
  }
}
