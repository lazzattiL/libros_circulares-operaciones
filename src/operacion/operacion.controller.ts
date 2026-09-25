import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { OperacionService } from './operacion.service';

@Controller('operacion')
export class OperacionController {
  constructor(private readonly operaciones: OperacionService) {}

  @Get()
  listar() {
    return this.operaciones.listar();
  }

  @Post('consulta')
  @HttpCode(200)
  consultar(@Body() body: unknown) {
    return this.operaciones.consultar(body);
  }

  @Post('prestamo')
  @HttpCode(200)
  prestamo(@Body() body: unknown) {
    return this.operaciones.prestamo(body);
  }

  @Post('devolucion')
  @HttpCode(200)
  devolucion(@Body() body: unknown) {
    return this.operaciones.devolucion(body);
  }
}
