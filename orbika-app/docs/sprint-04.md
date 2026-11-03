# Sprint 4 — Compra y actualización consistente del stock

Ejecución: 30/10/2026 (Lima). Fuente: `../../Planificacion_Sprints_Orbika_G01.pdf`,
página 7. Intervalo previsto: 26–31/10; compromiso: RF-07, 8 puntos.

## Análisis y resultado

RF-07 exige verificar cantidad, precio vigente y disponibilidad, registrar el
pedido con su estado inicial y descontar el stock una sola vez. También exige
rechazar sobrestock y comprobar dos compras concurrentes de las mismas unidades.
La implementación y las comprobaciones locales de este alcance están completas.

La transacción ya existía en las migraciones 002 y 003. Se conservó ese mecanismo
y se completaron la confirmación en la interfaz, la validación de entrada y las
pruebas con conexiones PostgreSQL independientes. No se añadió una migración.

## Diseño e implementación

| Criterio | Comportamiento y ubicación |
| --- | --- |
| Cantidad válida | `backend/src/validation/pedido.validation.js` exige enteros positivos seguros y limita la cantidad al rango `integer` de PostgreSQL. Rechaza booleanos, arreglos, fracciones y desbordamientos con HTTP 400. |
| Precio y disponibilidad vigentes | `frontend/src/pages/ProductDetail.jsx` consulta de nuevo la oferta antes de abrir una confirmación nueva. La RPC vuelve a comprobar disponibilidad y calcula el total usando el precio persistido; ignora precios e identidad enviados en el cuerpo por el cliente. |
| Reserva atómica | `crear_pedido_transaccion`, en la migración 003, bloquea la fila del producto con `FOR UPDATE`. Pedido, detalle histórico, descuento del stock y notificación pertenecen a la misma transacción. |
| Concurrencia | La segunda compra espera el bloqueo y evalúa el stock que queda tras confirmar la primera. Si ya no alcanza, la API devuelve HTTP 409 con `DATA_CONFLICT`. |
| Reintentos | Una clave UUID identifica cada intento. El bloqueo asesor y la búsqueda por comprador/clave devuelven el pedido existente sin descontar otra vez. Cambiar los datos de una clave usada se rechaza. |
| Datos del intento | La interfaz envía una copia de cantidad, modalidad y referencia. Bloquea los controles y los dobles clics mientras confirma. Revisar un modal sin enviarlo vuelve a consultar la oferta al abrirlo. |
| Stock visible | Después de confirmar se consulta el producto; no se resta el stock recordado en el navegador. Si falla esa consulta, se conserva el éxito del pedido y se exige actualizar antes de otra compra. |
| Estado inicial | Se persiste y muestra `creado`; no se anuncia éxito si la API rechaza o no confirma el pedido. |

Una consulta previa en la interfaz no reserva unidades: la decisión definitiva
corresponde a la transacción de PostgreSQL. Ante una respuesta perdida se permite
reenviar los mismos datos y la misma clave, incluso si la primera solicitud agotó
el producto. El precio final es el vigente cuando la transacción obtiene el bloqueo.

## Pruebas y evidencias

| Ensayo | Resultado |
| --- | --- |
| Backend: validaciones, servicios, HTTP y SQL/PGlite | 116 pruebas aprobadas. Incluye precio vigente, estado inicial, sobrestock y reversión de pedido/detalle/stock si falla la notificación final. |
| Frontend: pruebas unitarias | 50 pruebas aprobadas. |
| Compilación de producción | Correcta. |
| Interfaz compilada en Edge | 8 escenarios aprobados, con API y Auth simuladas. |
| PostgreSQL 18.6 nativo, conexiones independientes | 5 casos aprobados, incluyendo las rutas HTTP con SQL persistido. |
| Regresión de navegador | Registro, recuperación, roles, comprador, vendedor y demostración aprobados. |

Resultados de PostgreSQL, en
[`evidencias/sprint-04/concurrencia.json`](evidencias/sprint-04/concurrencia.json):

- Precio actualizado a S/ 4: comprar 2 unidades crea un pedido por S/ 8;
  reintentar devuelve el mismo pedido. Stock: 3 → 1, un pedido y un detalle.
- Pedir 2 cuando queda 1: conflicto 409; conserva stock, pedido y detalle.
- Dos compradores piden 2 de las mismas 3 unidades: se verifican dos conexiones
  esperando bloqueos reales antes de liberar la fila. Una compra se confirma y
  la otra recibe conflicto 409. Resultado: stock 1, un pedido y un detalle.
- Dos conexiones envían la misma clave: ambas obtienen el mismo pedido;
  stock 3 → 1, un pedido y un detalle.
- `POST /api/pedidos`: HTTP 201, estado `creado`, total S/ 10 por 2 unidades a
  S/ 5, aunque el cuerpo intente enviar otro precio. Segundo intento con otra
  clave y sin stock suficiente: HTTP 409. Se guardan ambas respuestas completas
  y los conteos antes y después.

Los escenarios de interfaz y sus resultados están en
[`evidencias/sprint-04/interfaz.json`](evidencias/sprint-04/interfaz.json):
precio cambiado, disponibilidad modificada antes de confirmar, revisión del
modal, conflicto posterior a la consulta, doble clic y controles bloqueados,
respuesta perdida con reintento, fallo de recarga después del éxito y pantalla
de 320 px con rechazo de cantidad fraccionaria. Las capturas están en la misma
carpeta; usan únicamente datos ficticios.

## Reproducir

Después de instalar las dependencias de cada carpeta:

```powershell
# En backend
npm test

# PostgreSQL nativo instalado: indicar su carpeta bin, con initdb y pg_ctl.
$env:ORBIKA_PG_BIN = 'C:\Program Files\PostgreSQL\18\bin'
npm run test:sprint4

# En frontend
npm test
npm run build
npm run test:sprint4
npm run test:browser
```

El ensayo nativo crea una base efímera dentro de `backend/.local-test`, escucha
solo en `127.0.0.1:65439`, aplica las migraciones 001–004, crea datos ficticios y
apaga PostgreSQL al terminar. Necesita ese puerto libre y permisos de ejecución
de PostgreSQL. No requiere un servicio PostgreSQL del sistema en ejecución.
Los archivos temporales quedan fuera de Git. `pg` y `supertest` son dependencias
de desarrollo; las herramientas nativas se proporcionan mediante `ORBIKA_PG_BIN`.

La prueba de navegador usa Edge instalado; `ORBIKA_BROWSER_CHANNEL` permite
cambiar el canal. `ORBIKA_QA_OUTPUT` cambia el directorio del informe y capturas.
Por defecto usa `frontend/test-results/sprint-04`. La prueba nativa guarda su
informe en `docs/evidencias/sprint-04/concurrencia.json`.

## Límites de la verificación

No se modificó la base Supabase configurada ni se hicieron compras con cuentas
reales. La concurrencia se comprobó con PostgreSQL nativo local; la identidad
de la prueba HTTP y las tablas externas de Auth/Storage son ficticias. Queda la
aceptación en el despliegue con Supabase Auth, PostgREST y cuentas reales. Este
ensayo no mide carga de producción ni disponibilidad mensual.
