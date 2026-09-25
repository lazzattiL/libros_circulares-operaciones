import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EjemplaresClient,
  EjemplarRemoto,
} from '../integraciones/ejemplares.client';
import { PersonasClient } from '../integraciones/personas.client';
import {
  bodyObject,
  ejemplarId,
  integerId,
  required,
} from '../shared/validation';
import { Operacion } from './operacion.entity';
import { operacionCreadaView, operacionView } from './operacion.view';
import { OperacionesStore } from './operaciones.store';

@Injectable()
export class OperacionService {
  constructor(
    private readonly store: OperacionesStore,
    private readonly ejemplares: EjemplaresClient,
    private readonly personas: PersonasClient,
  ) {}

  listar() {
    return this.store.listar().map(operacionView);
  }

  consultar(value: unknown) {
    const body = bodyObject(value);
    const id = ejemplarId(required(body, 'ejemplarId'));
    const operacion = this.store.ultima(id);
    if (!operacion) {
      throw new NotFoundException('La operación no existe');
    }
    return operacionView(operacion);
  }

  prestamo(value: unknown) {
    const body = bodyObject(value);
    const id = ejemplarId(required(body, 'ejemplarId'));
    const nuevoPoseedorId = integerId(
      required(body, 'nuevoPoseedorId'),
      'nuevoPoseedorId',
    );
    const comunidadId = integerId(required(body, 'comunidadId'), 'comunidadId');
    return this.store.serializar(id, async () => {
      const ejemplar = await this.ejemplares.consultar(id);
      const anterior = this.store.ultima(id);
      this.verificarActivo(anterior);
      const poseedorActualId = this.poseedorActual(ejemplar, anterior);
      if (poseedorActualId === nuevoPoseedorId) {
        throw new ConflictException('El nuevo poseedor ya posee el ejemplar');
      }
      await this.personas.verificarUsuario(poseedorActualId);
      await this.personas.verificarUsuario(nuevoPoseedorId);
      const miembros = await this.personas.miembros(comunidadId);
      if (
        !miembros.includes(poseedorActualId) ||
        !miembros.includes(nuevoPoseedorId)
      ) {
        throw new ConflictException(
          'Los usuarios no pertenecen a la misma comunidad',
        );
      }
      const operacion = this.store.registrar('prestamo', anterior, {
        ejemplarId: id,
        poseedorId: nuevoPoseedorId,
        activo: true,
        comunidadId,
      });
      return operacionCreadaView(operacion);
    });
  }

  devolucion(value: unknown) {
    const body = bodyObject(value);
    const id = ejemplarId(required(body, 'ejemplarId'));
    return this.store.serializar(id, async () => {
      const ejemplar = await this.ejemplares.consultar(id);
      const anterior = this.store.ultima(id);
      this.verificarActivo(anterior);
      if (this.poseedorActual(ejemplar, anterior) === ejemplar.duenioId) {
        throw new ConflictException(
          'El ejemplar ya está en poder de su propietario',
        );
      }
      await this.personas.verificarUsuario(ejemplar.duenioId);
      const operacion = this.store.registrar('devolucion', anterior, {
        ejemplarId: id,
        poseedorId: ejemplar.duenioId,
        activo: true,
        comunidadId: anterior?.comunidadId ?? null,
      });
      return operacionCreadaView(operacion);
    });
  }

  cesion(value: unknown) {
    const body = bodyObject(value);
    const id = ejemplarId(required(body, 'ejemplarId'));
    const nuevoDuenioId = integerId(
      required(body, 'nuevoDuenioId'),
      'nuevoDuenioId',
    );
    return this.store.serializar(id, async () => {
      const ejemplar = await this.ejemplares.consultar(id);
      const anterior = this.store.ultima(id);
      this.verificarActivo(anterior);
      if (ejemplar.duenioId === nuevoDuenioId) {
        throw new ConflictException('El usuario ya es el dueño');
      }
      await this.personas.verificarUsuario(ejemplar.duenioId);
      await this.personas.verificarUsuario(nuevoDuenioId);
      await this.ejemplares.cambiarDuenio(id, nuevoDuenioId);
      const operacion = this.store.registrar('cesion', anterior, {
        ejemplarId: id,
        poseedorId: this.poseedorActual(ejemplar, anterior),
        activo: true,
        comunidadId: anterior?.comunidadId ?? null,
      });
      return operacionCreadaView(operacion);
    });
  }

  baja(value: unknown) {
    const body = bodyObject(value);
    const id = ejemplarId(required(body, 'ejemplarId'));
    return this.store.serializar(id, async () => {
      const ejemplar = await this.ejemplares.consultar(id);
      const anterior = this.store.ultima(id);
      this.verificarActivo(anterior);
      const operacion = this.store.registrar('baja', anterior, {
        ejemplarId: id,
        poseedorId: this.poseedorActual(ejemplar, anterior),
        activo: false,
        comunidadId: anterior?.comunidadId ?? null,
      });
      return operacionCreadaView(operacion);
    });
  }

  private poseedorActual(
    ejemplar: EjemplarRemoto,
    anterior: Operacion | undefined,
  ): number {
    return anterior?.poseedorId ?? ejemplar.duenioId;
  }

  private verificarActivo(anterior: Operacion | undefined): void {
    if (anterior?.activo === false) {
      throw new ConflictException('El ejemplar está dado de baja');
    }
  }
}
