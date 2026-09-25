import { Operacion } from './operacion.entity';

export function operacionView(operacion: Operacion) {
  return {
    id: operacion.id,
    operacionAsociadaId: operacion.operacionAsociadaId,
    tipo: operacion.tipo,
    ejemplarId: operacion.ejemplarId,
    poseedorId: operacion.poseedorId,
    activo: operacion.activo,
    comunidadId: operacion.comunidadId,
  };
}

export function operacionCreadaView(operacion: Operacion) {
  return { ...operacionView(operacion), fechaHora: operacion.fechaHora };
}
