# Especificación del servicio de gestión de usuarios

## Contexto global

El proyecto **"Libros Circulares"** promueve el préstamo de libros entre personas, incluso sin necesidad de que el ejemplar vuelva a su dueño original y sin que este pierda su propiedad.

Esto significa que, si una persona A presta un libro a B, B puede prestárselo a C y C a D. Sin embargo, la propiedad continúa perteneciendo a A hasta que este decida cederla a otra persona.

Las operaciones permitidas son el préstamo, la devolución, la cesión de la propiedad y la baja del ejemplar.

## Contexto local

Las operaciones permitidas son el préstamo, devolución, la cesión de la propiedad y la baja del ejemplar.

El préstamo implica que una persona que tenía en su poder el libro lo cede temporalmente a otra. Sólo puede realizar el préstamo si lo tiene actualmente en su poder. Incluso si es el propietario no podrá prestarlo si no lo tiene en su poder.

La devolución es el vencimiento del préstamo sin que se haya producido un nuevo préstamo por lo cual el libro es retornado a su propietario.

La cesión de la propiedad es el cambio de propietario y sólo puede ser realizado por el propietario. Para realizar la cesión no es necesario tenerlo en su poder y puede realizarlo en cualquier momento a cualquier usuario.

La baja del ejemplar implica que un ejemplar ya no está disponible para participar en el circuito de circulación de libros y sobre él no se podrá realizar ninguna operación.

Cuando un ejemplar comienza a participar del circuito, su poseedor inicial es su propietario y su estado inicial es activo.

## Restricciones técnicas

El proyecto utiliza **NestJS** y el protocolo HTTP.

Las entradas y salidas utilizan formato **JSON**.

No se utilizan bases de datos. La información se almacena únicamente mediante repositorios persistentes en memoria.

No es necesario completar los tests ni agregar comentarios innecesarios.

## Entidades a implementar

### Clase `EstadoEjemplar`

```typescript
export class EstadoEjemplar {
  ejemplarId: number;
  poseedorId: number;
  activo: boolean;
}
```

## Operaciones / flujos permitidos

### Obtener estado de un ejemplar

* HTTP Request: GET

* Endpoint: `/estadoEjemplar/:ejemplarId`

* Salida:

  * `ejemplarId`
  * `poseedorId`
  * `activo`

* Códigos de estado:

  * Operación exitosa: 200
  * El ejemplar no existe: 404
  * Datos no procesables: 422

### Obtener estado de todos los ejemplares

* HTTP Request: GET

* Endpoint: `/estadoEjemplar`

* Salida: Todos los `ejemplarId`, `poseedorId`, `activo` registrados

  * ejemplarId
  * poseedorId
  * activo

* Códigos de estado:

  * Operación exitosa: 200
  * El ejemplar no existe: 404
  * Datos no procesables: 422

### prestamo de ejemplar

* HTTP Request: PATCH

* Endpoint: `/estadoEjemplar/:ejemplarId/prestamo`

* Cuerpo:
  
  * `poseedorActualId`
  * `nuevoPoseedorId`

* Salida:

  * `ejemplarId`
  * `poseedorId`
  * `activo`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * Datos no procesables: 422
  * El ejemplar no existe: 404
  * El poseedor actual no existe: 404
  * El nuevo poseedor ya posee actualmente el libro: 409
  * El nuevo poseedor no existe: 404
  * El poseedor actual no posee actualmente el ejemplar: 409
  * El ejemplar está dado de baja: 409

### Devolución de ejemplar

* HTTP Request: PATCH

* Endpoint: `/estadoEjemplar/:ejemplarId/devolucion`

* Salida:

  * `ejemplarId`
  * `poseedorId`
  * `activo`

* Códigos de estado:

  * Operación exitosa: 200
  * Datos no procesables: 422
  * El ejemplar no existe: 404
  * El ejemplar está dado de baja: 409
  * El ejemplar ya se encuentra en poder de su propietario: 409

### Cesión de propiedad de ejemplar

* HTTP Request: POST

* Endpoint: `/estadoEjemplar/:ejemplarId/cesion`

* Cuerpo:

  * `duenioActualId`
  * `nuevoDuenioId`

* Salida:

  * `ejemplarId`
  * `duenioId`

* Códigos de estado:
  
  * Operación exitosa: 200
  * Faltan valores: 400
  * El ejemplar no existe: 404
  * El duenio actual no existe: 404
  * El nuevo duenio no existe: 404
  * El usuario no es el duenio actual: 409
  * El usuario ya es el duenio: 409
  * El ejemplar está dado de baja: 409
  * Datos no procesables: 422

* Interacciones con otros servicios
  * Consultar Gestión de Ejemplares para obtener el duenio actual.
  * Consultar Gestión de Usuarios para verificar que el nuevo duenio exista.
  * Solicitar a Gestión de Ejemplares el cambio de duenio.

### Dar de baja un ejemplar

* HTTP Request: PATCH

* Endpoint: `/estadoEjemplar/:ejemplarId/baja`

* Salida:

  * `ejemplarId`
  * `activo`

* Códigos de estado:
  
  * Operación exitosa: 200
  * El ejemplar no existe: 404
  * El ejemplar ya está dado de baja: 409

## Casos de uso conflictivos