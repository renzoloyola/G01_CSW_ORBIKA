# Estado de implementación de ÓrbiKa

Revisión técnica del 9 de octubre de 2026. El producto contiene parte del núcleo
comercial y mantiene diez casos de uso pendientes. Este registro actualiza el
alcance que debe declararse en FD04, FD05 y FD06: el avance local no demuestra
cumplimiento integral ni aceptación en un entorno remoto.

## Arquitectura del código

La interfaz utiliza React 18, Vite, Tailwind y React Router. Las páginas se cargan
por demanda. AuthContext maneja sesión y perfil; Axios adjunta el token; el servicio
marketplace separa lecturas reales y demostración. La demostración es explícita,
solo de lectura y no se activa como respuesta a un error.

El backend utiliza Express con rutas, controladores, servicios y validaciones.
Comprueba el token con Supabase Auth y verifica rol, propiedad y estado de cuenta.
Las operaciones de compra y cancelación se ejecutan en funciones PostgreSQL.
La carga de imágenes utiliza Supabase Storage mediante el backend. No hay ORM
Sequelize, Cloudinary ni hashing de contraseñas implementado dentro de Express.

El esquema actual usa perfiles, categorías, productos, pedidos, detalle de
pedidos, calificaciones y notificaciones, además de las tablas gestionadas por
Supabase. La referencia al producto reside en el detalle. Cada pedido tiene un
detalle y una clave de confirmación para controlar reintentos de compra.

## Trazabilidad funcional

| Caso de uso | Evidencia en el repositorio | Alcance actual |
| --- | --- | --- |
| CU-01 Registrar | Auth.jsx, AuthContext, trigger de perfil | Registro comprador/vendedor; confirmación de correo depende de Auth |
| CU-02 Acceso | AuthContext, ProtectedRoute, middleware | Sesión, cierre y permisos; administración de cuentas pendiente |
| CU-03 Buscar | ProductList, producto.service, vista SQL | Filtros, orden y estados vacío/error; prioridad premium pendiente |
| CU-04 Detalle | ProductDetail | Ficha y disponibilidad; promedio del vendedor pendiente |
| CU-05 Comprar | Marketplace, pedido.service, RPC SQL | Pedido, stock, aviso e idempotencia; pago externo |
| CU-06 Calificar | OrderActions, pedido.service, calificaciones | Comprador, pedido completado, una calificación |
| CU-07 Publicar | ProductForm, producto.service, imagen.service | Categoría activa, fecha futura, precios y foto JPG/PNG |
| CU-08 Pedidos | MyOrders, OrderActions, pedido.service | Estados por participante; métricas básicas de completados |
| CU-13 Recuperar | RecoverPassword, UpdatePassword, AuthContext | Formularios; TTL, correo y revocación efectiva requieren validación remota |
| CU-17 Cancelar | OrderActions, RPC SQL | Creado/Preparando; devuelve stock y notifica una vez |
| CU-19 Editar | EditProduct, ProductForm, producto.service | Campos permitidos y stock; identidad de oferta conservada |
| CU-09, 10, 11, 12, 14, 15, 16, 18, 20, 21 | Sin módulos completos | Pendientes; no deben declararse aprobados |

La presencia de código en once casos no equivale a once casos aceptados en
producción. CU-04, CU-08 y CU-13 tienen las limitaciones indicadas en la tabla.

## Concordancia con las decisiones del SRS

| Decisión | Ajuste incorporado | Límite pendiente |
| --- | --- | --- |
| D01 Roles | Registro público comprador/vendedor, permisos protegidos | Panel administrador |
| D02 Estados | Listo para entrega; completa el comprador | Validación con participantes reales |
| D03 y D04 Disponibilidad | Publicado/Retirado, categoría/vendedor activos, stock y fecha de Lima | Interfaz administrativa para suspensión y retiro |
| D05 Detalle e historia | Producto en detalle único; precios y peso de compra | Datos históricos previos desconocidos |
| D06 Pago y entrega | Recojo/coordinada; importe de pedido | Mensajería de coordinación |
| D07 Impacto | Resúmenes solo de completados; se eliminan cifras ambientales ficticias | Estadísticas completas, período y cálculo de kg/ahorro |
| D08 Calificación | Restricciones por comprador y pedido completado | Promedio público del vendedor |
| D09 Suspensión | No nuevas compras/publicaciones/ediciones de cuenta inactiva | CU-10 y mensajería; completar/cancelar pedidos existentes sigue permitido |
| D10, D11, D12 y D14 | Campos y permisos básicos sin declarar módulos completos | Moderación, categorías, suscripciones y exportación |
| D13 Fotografías | JPG/PNG hasta 5 MB en Storage | Foto y edición de perfil |
| D15 Integridad | Compra/cancelación atómicas; reintentos y stock conservados | Pruebas con múltiples conexiones Supabase |

## Correcciones frente a documentos anteriores

El SRS FD03 se conserva como referencia del comportamiento esperado. Las
descripciones anteriores que permiten al vendedor completar un pedido o vender
durante el día de vencimiento no son las reglas del código actual.

FD04 describe tanto Sequelize/Cloudinary/SMTP como un esquema de siete tablas y
otro de dieciocho entidades. La arquitectura implementada es la descrita arriba;
las entidades de favoritos, conversaciones, moderación y suscripciones son diseño
pendiente, no tablas desplegadas. El README anterior que afirmaba que todo el
modelo ya existía se ha corregido.

Las afirmaciones de FD05/FD06 de cumplimiento total, trazabilidad perfecta,
catálogo de 63 casos aprobados, bcrypt local o pilotaje validado no deben usarse
como evidencia del repositorio. El número de pruebas automatizadas representa
comprobaciones técnicas específicas, no aceptación de los 21 casos de uso. La
viabilidad económica y las cifras de impacto requieren evidencia propia y no se
deducen del código. Los DOCX académicos se mantienen como antecedentes; este
registro técnico aporta el estado revisado para su próxima versión formal.

## Despliegue y datos existentes

La migración 003 se aplica después de 001 y 002, coordinada con la actualización
de la API y frontend. Cambia la firma de compra y normaliza la relación producto/
pedido. Añade un detalle a pedidos antiguos que no lo tenían, usando cantidad y
precio pagado conocidos. No inventa precio original, peso ni nombre histórico.
La restricción de un detalle por pedido aborta la migración si hay múltiples
detalles existentes; requiere revisar esos registros antes de repetirla.

La migración crea el bucket orbika-productos y solicita la recarga del esquema
PostgREST. Las políticas de pedidos y detalles permiten leer a sus participantes;
las escrituras de productos y funciones privilegiadas pasan por el backend.

## Evidencia de verificación

El backend incluye validaciones, servicios, rutas HTTP y ejecución de las tres
migraciones en PostgreSQL en memoria mediante PGlite. Se verifican preservación
de pedidos antiguos, idempotencia, cancelación repetida, snapshots, reposición,
vencimiento, cuentas/categorías inactivas y RLS sin recursión.

El frontend incluye pruebas de permisos de acciones, cálculo de fechas de Lima
y separación de datos reales/demo. La prueba browser-smoke levanta servidores
aislados y comprueba vacío, fallo de conexión, producto inexistente, historial
vacío, compra rechazada, reintento, subida de imagen, publicación rechazada y
confirmada, campos inmutables y demo de solo lectura.

La API/Auth de la prueba de navegador se simulan. PGlite ejecuta PostgreSQL,
pero las dependencias externas de Auth/Storage tienen un esquema mínimo y una
sola conexión. Antes del piloto faltan pruebas reales de correo, TTL de 30
minutos, PostgREST, Storage, revocación y concurrencia, además de las mediciones
de los requisitos de rendimiento y disponibilidad. No se ha aplicado la
migración a la base remota desde esta revisión.

Referencias técnicas:
[PGlite](https://pglite.dev/docs/),
[Supabase Storage](https://supabase.com/docs/reference/javascript/storage-from-upload),
[relaciones PostgREST](https://docs.postgrest.org/en/stable/references/api/resource_embedding.html).
