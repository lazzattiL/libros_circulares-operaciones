# Especificación del servicio de operaciones

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

El servicio consulta gestión de ejemplares mediante `EJEMPLARES_SERVICE_URL` y gestión de personas y comunidades mediante `PERSONAS_SERVICE_URL`. Una consulta necesaria que no responda, no esté configurada o devuelva datos inválidos impide registrar la operación y devuelve 503.

Los identificadores de usuarios y comunidades son enteros positivos. `ejemplarId` es un número positivo finito porque gestión de ejemplares actualmente genera identificadores fraccionarios. Un valor requerido ausente devuelve 400 y uno mal formado devuelve 422.

Antes de la primera operación, el poseedor de un ejemplar es su dueño registrado en gestión de ejemplares y el ejemplar está activo. La primera operación tiene `operacionAsociadaId: null`; `comunidadId` permanece en `null` hasta que se realice un préstamo y luego conserva la última comunidad usada. La operación más reciente se determina por `fechaHora` y, si coincide, por el mayor `id`. Las operaciones de un mismo ejemplar se procesan en orden.

Las solicitudes de préstamo y cesión no contienen la identidad de quien las envía; el servicio valida el estado registrado y los usuarios involucrados, pero no autentica al solicitante.

## Entidades a implementar

### Clase `Operacion`

```typescript
export class Operacion {
  id: number;
  operacionAsociadaId: number | null;
  tipo: 'prestamo' | 'devolucion' | 'cesion' | 'baja';
  ejemplarId: number;
  poseedorId: number;
  activo: boolean;
  fechaHora: Date;
  comunidadId: number | null;
}
```

## Operaciones / flujos permitidos

### Obtener datos de operación

* HTTP Request: POST

* Endpoint: `/operacion/consulta`

* Cuerpo:

  * `ejemplarId`

* Salida:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * La operación no existe: 404
  * Datos no procesables: 422

### Obtener todas las operaciones

* HTTP Request: GET

* Endpoint: `/operacion`

* Salida: todas las operaciones registradas con los campos:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200

### Préstamo de ejemplar

* Descripción:

  Busca la última operación del ejemplar por `fechaHora` (o parte del dueño si no hay operaciones), cambia `poseedorId` a `nuevoPoseedorId` y referencia la operación inmediatamente anterior. El poseedor actual y el nuevo deben existir y pertenecer a `comunidadId`. Guarda el tipo y la fecha y hora de la nueva operación.

* HTTP Request: POST

* Endpoint: `/operacion/prestamo`

* Cuerpo:

  * `ejemplarId`
  * `nuevoPoseedorId`
  * `comunidadId`

* Salida:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `fechaHora`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * Datos no procesables: 422
  * El ejemplar no existe: 404
  * El poseedor actual no existe: 404
  * El nuevo poseedor ya posee actualmente el libro: 409
  * El nuevo poseedor no existe: 404
  * La comunidad no existe: 404
  * Los usuarios no pertenecen a la comunidad: 409
  * El ejemplar está dado de baja: 409
  * No se pudo consultar otro servicio: 503

### Devolución de ejemplar

* Descripción:

Consulta el dueño actual en gestión de ejemplares y registra una nueva operación con ese usuario como poseedor. Conserva la comunidad de la operación anterior y actualiza la referencia, la fecha y la hora.

* HTTP Request: POST

* Endpoint: `/operacion/devolucion`

* Cuerpo:

  * `ejemplarId`

* Salida:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `fechaHora`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * Datos no procesables: 422
  * El ejemplar no existe: 404
  * El dueño actual no existe: 404
  * El ejemplar está dado de baja: 409
  * El ejemplar ya se encuentra en poder de su propietario: 409
  * No se pudo consultar otro servicio: 503

* Interacciones con otros servicios

  * Consultar a gestión de ejemplares el id del duenio del ejemplar

### Cesión de propiedad de ejemplar

* Descripción:

  Reemplaza el dueño en gestión de ejemplares por `nuevoDuenioId`, que puede ser cualquier usuario registrado. El poseedor no cambia. Después de confirmar el cambio, registra la operación asociada, la fecha y la hora.

* HTTP Request: POST

* Endpoint: `/estadoEjemplar/cesion`

* Cuerpo:

  * `ejemplarId`
  * `nuevoDuenioId`

* Salida:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `fechaHora`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * El ejemplar no existe: 404
  * El duenio actual no existe: 404
  * El nuevo duenio no existe: 404
  * El usuario ya es el duenio: 409
  * El ejemplar está dado de baja: 409
  * Datos no procesables: 422
  * No se pudo consultar o actualizar otro servicio: 503

* Interacciones con otros servicios

  * Consultar Gestión de Usuarios para verificar que el nuevo duenio exista.
  * Solicitar a Gestión de Ejemplares el cambio de duenio.

### Dar de baja un ejemplar

* Descripción:

  Conserva el poseedor y la comunidad de la última operación, o usa el dueño y `null` si es la primera. Registra una nueva operación con `activo: false`; después no se admite ninguna operación sobre el ejemplar.

* HTTP Request: POST

* Endpoint: `/estadoEjemplar/baja`

* Cuerpo:

  * `ejemplarId`

* Salida:

  * `id`
  * `operacionAsociadaId`
  * `tipo`
  * `ejemplarId`
  * `poseedorId`
  * `activo`
  * `fechaHora`
  * `comunidadId`

* Códigos de estado:

  * Operación exitosa: 200
  * Faltan valores: 400
  * Datos no procesables: 422
  * El ejemplar no existe: 404
  * El ejemplar ya está dado de baja: 409
  * No se pudo consultar gestión de ejemplares: 503

## Casos de uso conflictivos
