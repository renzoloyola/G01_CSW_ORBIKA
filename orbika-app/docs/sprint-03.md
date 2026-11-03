# Sprint 3 — Catálogo encontrable

Fecha de ejecución: 25/10/2026 (Lima). Plan: `../../Planificacion_Sprints_Orbika_G01.pdf`,
páginas 3–5, 7 y 10. Intervalo previsto: 24–26/10; compromiso RF-05, RF-06 y RNF-02.
Se continúa sobre los sprints 1 y 2 existentes. No se implementa el sprint 4 en esta entrega.

## Resultado y alcance

Implementación y comprobaciones del sprint completadas en los entornos descritos
abajo. La búsqueda combina nombre, categoría, distrito y precio máximo; el detalle
presenta descripción, precios, descuento, stock, vendedor, vencimiento e imagen.
Ambos ensayos de rendimiento obtuvieron p95 inferior a 3 segundos.
Esto no constituye aceptación de rendimiento del despliegue completo bajo carga:
la medición remota tuvo catálogo vacío, un producto no disponible y un solo usuario.

## «Mis ventas»

El fallo de esquema descrito en el registro del 24/10 ya estaba resuelto en la base
configurada. Se comprobó la relación `pedidos → detalle_pedidos → productos` por
PostgREST y el servicio real leyó seis pedidos correspondientes a dos vendedores.
Se comprobó que cada respuesta pertenece al vendedor solicitado. No se repitieron
migraciones ni se crearon/modificaron pedidos, usuarios o productos.

Se reforzó el código para que un esquema incompatible devuelva
`ORDER_SCHEMA_NOT_READY` (503), y una lectura fallida `ORDER_QUERY_FAILED` (502),
en lugar de confundirlos con conflictos de compra. La interfaz conserva el error
y permite reintentar; nunca lo presenta como ausencia de ventas. Al cambiar de
cuenta se recarga el historial y se descartan respuestas pendientes de la anterior.
Las pruebas cubren también la relación de detalle como objeto o arreglo.

`backend/scripts/check-read-model.js` permite repetir el diagnóstico de solo lectura,
sin imprimir identidades, claves ni el contenido de los pedidos. Inspecciona los
vendedores encontrados entre los primeros 100 productos: es una comprobación
acotada, no una auditoría exhaustiva de una base grande.

## Análisis, diseño e implementación

- RF-05: los dos formularios de precio máximo usaban `min=0.10` y `step=0.50`,
  que rechazaban importes como 5.25. Ahora admiten céntimos desde 0.01.
- RF-05: las respuestas de búsquedas anteriores podían reemplazar resultados
  nuevos. Se identifica cada solicitud y solo la vigente actualiza la vista.
- RF-05: los errores de categorías se conservan, tienen reintento y no se muestran
  simultáneamente como un catálogo vacío. Se valida la forma y longitud de los
  filtros en la API, evitando errores internos por parámetros repetidos/objetos.
- RF-06: el detalle descarta respuestas antiguas al cambiar de producto, reinicia
  cantidad y referencia, y el botón «Volver al catálogo» conduce a `/catalogo`.
- RF-06: se consulta también el nombre del vendedor para el caso de un perfil sin
  nombre de negocio. Un fallo de conexión no se convierte en un falso 404.
- RNF-02: se añadieron dos ensayos reproducibles con compilaciones aisladas;
  los datos y capturas ficticios no necesitan modificar Supabase.

Archivos principales: `frontend/src/pages/ProductList.jsx`, `ProductDetail.jsx`,
`MyOrders.jsx`; `backend/src/services/producto.service.js`, `pedido.service.js`.

## Trazabilidad y comprobaciones

| Caso | Resultado observado | Evidencia |
| --- | --- | --- |
| CP-S03-01 / RF-05 | «pan», Panadería, Tacna y máximo S/ 5.25 devuelven solamente Pan integral; máximo S/ 1 devuelve vacío | `filtros-combinados.png`, `sin-resultados.png` |
| RF-05 / persistencia | Servicio de búsqueda ejecutado sobre PostgreSQL en memoria; nombre sin distinción de mayúsculas, categoría, zona, precio y orden combinados | `backend/test/sql/database.test.js` |
| RF-05 / concurrencia de lecturas | Una búsqueda «pan» retenida no reemplaza «Manzanas» al responder después | `frontend/test/sprint3-checks.mjs` |
| RF-05 / fallo de categorías | Error visible, sin falso vacío, recuperación al reintentar | `frontend/test/sprint3-checks.mjs` |
| RF-06 | Nombre, descripción, S/ 5.25, descuento 47.5 %, tres unidades, comercio, 01/01/2099 e imagen decodificada | `detalle.png` |
| Adaptación | Filtros en modal y detalle utilizables a 320 px; sin desbordamiento horizontal | `catalogo-320.png`, `detalle-320.png` |
| Ventas | Lista con pedido, error de esquema visible, reintento y estado vacío correcto | `mis-ventas.png`; servicio remoto de solo lectura |
| RNF-02 | 20 mediciones por página y escenario; p95 por rango más cercano | JSON y CSV de tiempos |

Las capturas están en [evidencias/sprint-03](evidencias/sprint-03) y contienen
únicamente datos ficticios. Se inspeccionaron visualmente catálogo y detalle móvil.

Validación ejecutada:

- Backend: **104 pruebas aprobadas** (incluidas migraciones y filtros sobre PGlite).
- Frontend: **50 pruebas aprobadas**.
- Compilación de producción: correcta.
- Regresión en navegador: registro, recuperación, roles, cierre, compra/reintento,
  publicación, imagen y modo demo aprobados.
- Navegador del sprint 3: filtros, errores, detalle, móvil y ventas aprobados.

## Rendimiento y condiciones

Equipo: Windows 10 (10.0.19045), Intel i5-8250U, 16 GiB RAM; Node 24.22.1;
Edge 156.0.4314.42, sin interfaz visible, viewport 1440 × 1000.

Cada escenario usa frontend compilado y un contexto de navegador nuevo en cada
navegación. Servidores calientes; sin limitación artificial de CPU ni ancho de
banda. Concurrencia: un usuario. Se cronometra desde la navegación hasta disponer
de datos, categorías del catálogo, imágenes visibles decodificadas y dos cuadros
de pintura. Es tiempo observable de carga, no solo latencia de API ni LCP.

El percentil se calcula ordenando las 20 muestras y tomando la posición
`ceil(0.95 × 20) = 19`; se conservan todas las muestras y el máximo.

| Escenario | Catálogo p95 | Detalle p95 | Datos |
| --- | ---: | ---: | --- |
| Controlado | 586 ms | 537 ms | 5 ofertas ficticias; API/Auth simuladas; 80 ms añadidos a cada lectura de productos |
| Supabase real | 1388 ms | 1692 ms | Express y frontend locales; 0 ofertas disponibles; detalle de producto no disponible |

Fuentes: [rendimiento.json](evidencias/sprint-03/rendimiento.json),
[tiempos.csv](evidencias/sprint-03/tiempos.csv),
[rendimiento-remoto.json](evidencias/sprint-03/rendimiento-remoto.json) y
[tiempos-remotos.csv](evidencias/sprint-03/tiempos-remotos.csv).

La medición real no intercepta peticiones y no realizó escrituras. No hubo fallos
de decodificación de imágenes. Durante parte de ese ensayo se ejecutó también la
regresión local de navegador: la actividad de fondo puede afectar las muestras.
La medición controlada cubre un catálogo poblado; la remota cubre la conexión real
con los datos existentes. Ninguna acredita rendimiento de un catálogo grande,
carga concurrente ni disponibilidad mensual.

## Reproducción y siguiente aceptación

Desde `backend`: `npm test` y `npm run check:data`.
Desde `frontend`: `npm test`, `npm run build`, `npm run test:browser`,
`npm run test:sprint3` y `npm run test:performance:live`.
Requiere instalar las dependencias de ambas carpetas y Edge; el ensayo remoto
requiere las variables reales de ambos `.env`. Puertos de prueba: 5187/5188 para
interfaz y 5190/4119 para rendimiento remoto. No ejecutarlos simultáneamente con
otro proceso que ocupe esos puertos.

La salida predeterminada de los ensayos es `frontend/test-results/sprint-03`.
`ORBIKA_QA_OUTPUT` permite elegir un directorio para conservar la evidencia.
Las compilaciones de ensayo se escriben dentro de `frontend/test-results` y no
reemplazan `frontend/dist` ni cambian los archivos `.env`.

Para aceptación previa al piloto: publicar ofertas vigentes con las cuentas de
prueba, fijar volumen de datos y concurrencia representativos, y repetir la
medición en el despliegue elegido. Mantener pendientes las pruebas de correo,
Storage y compras simultáneas descritas en los sprints anteriores.
