import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OperacionService } from './operacion.service';

@Controller('estadoEjemplar')
export class EstadoEjemplarController {
  constructor(private readonly operaciones: OperacionService) {}

  @Post('cesion')
  @HttpCode(200)
  cesion(@Body() body: unknown) {
    return this.operaciones.cesion(body);
  }

  @Post('baja')
  @HttpCode(200)
  baja(@Body() body: unknown) {
    return this.operaciones.baja(body);
  }
}
