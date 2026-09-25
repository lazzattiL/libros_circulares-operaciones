import { Module } from '@nestjs/common';
import { EjemplaresClient } from './integraciones/ejemplares.client';
import { HttpClient } from './integraciones/http.client';
import { PersonasClient } from './integraciones/personas.client';
import { EstadoEjemplarController } from './operacion/estado-ejemplar.controller';
import { OperacionController } from './operacion/operacion.controller';
import { OperacionService } from './operacion/operacion.service';
import { OperacionesStore } from './operacion/operaciones.store';

@Module({
  controllers: [OperacionController, EstadoEjemplarController],
  providers: [
    HttpClient,
    EjemplaresClient,
    PersonasClient,
    OperacionesStore,
    OperacionService,
  ],
})
export class OperacionesModule {}
