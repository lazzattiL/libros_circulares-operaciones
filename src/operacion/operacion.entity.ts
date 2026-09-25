export type TipoOperacion = 'prestamo' | 'devolucion' | 'cesion' | 'baja';

export class Operacion {
  id: number;
  operacionAsociadaId: number | null;
  tipo: TipoOperacion;
  ejemplarId: number;
  poseedorId: number;
  activo: boolean;
  fechaHora: Date;
  comunidadId: number | null;
}
