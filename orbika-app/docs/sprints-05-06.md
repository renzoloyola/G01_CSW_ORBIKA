# Sprints 5 y 6: cancelación, confianza y perfil

Implementación: 02/11/2026, Lima. Alcance tomado de Planificacion_Sprints_Orbika_G01, página 8: RF-17, RF-09 y RF-14; criterios CP-S05-01 y CP-S06-01 de la página 10.

## Sprint 5

Se conserva la cancelación transaccional de 003: únicamente el comprador titular puede cancelar desde `creado` o `preparando`. Se bloquea la fila del pedido, se registra motivo/fecha, se devuelve stock y se notifica en una sola transacción. Repetir la cancelación devuelve el pedido existente sin reponer otra vez. `listo_para_entrega`, `entregado` y `completado` no son cancelables, conforme a las decisiones del SRS.

La interfaz bloquea dobles envíos y el cierre del modal durante la operación, limita el motivo a 300 caracteres y muestra motivo y fecha de cancelación. El error conserva la posibilidad de reintentar.

## Sprint 6

Nueva ruta protegida `/mi-perfil`, accesible desde la navegación de escritorio y móvil. Compradores editan nombre, teléfono, dirección y foto opcionales; vendedores disponen además de nombre y ubicación del negocio. El correo y el rol se muestran como información de la cuenta. El cambio de correo de acceso no se implementa mediante una actualización directa del perfil.

`GET/PATCH /api/perfil` usa exclusivamente la identidad de sesión. No acepta ID, correo, rol, estado, premium ni campos comerciales para un comprador. `POST /api/perfil/foto` valida JPG/PNG, firma y límite de 5 MB; almacena en una carpeta propia con nombre aleatorio. La actualización solo admite referencias al almacenamiento del titular. El guardado confirmado actualiza también el nombre de navegación; un fallo no anuncia éxito.

La calificación permanece ligada a un pedido completado y a su comprador. Se rechazan enteros fuera de 1–5, fracciones, booleanos, arreglos, pedidos pendientes, terceros y duplicados. La restricción única de la base resuelve dos escrituras concurrentes. El historial consulta y muestra la calificación registrada, también después de recargar, y deja de ofrecer el botón para calificar ese pedido. Los errores de conexión no se presentan como si fueran una calificación duplicada.

## Instalación

Aplicar **una sola vez** `supabase/migrations/005_profile_contact.sql` después de 001–004. Añade dirección y fotografía al perfil y el bucket público `orbika-perfiles`. No borra datos ni cambia los estados de los pedidos. Reiniciar el backend y reconstruir/reiniciar el frontend.

La migración se verificó en PostgreSQL local. **No se aplicó al Supabase remoto**; hasta aplicarla, el guardado de dirección/foto y su almacenamiento no están habilitados en ese entorno. Los archivos de fotografía cargados que nunca se vinculen a un perfil permanecen en Storage; su limpieza no forma parte de estos sprints.

## Validación reproducible

Resultado local final: 147 pruebas de backend y 50 de frontend aprobadas; compilación correcta, regresión general de navegador aprobada y 8 casos de PostgreSQL nativo aprobados (5 de compra, 2 de cancelación y 1 de calificación concurrente).

- Backend: `npm test` (servicios, HTTP, validaciones y SQL/PGlite).
- Backend: definir `ORBIKA_PG_BIN` y ejecutar `npm run test:sprints56`. Crea y apaga PostgreSQL temporal local, aplica 001–005 y usa datos ficticios. Comprueba dos cancelaciones simultáneas (stock 1 → 3 una sola vez, un aviso), rechazo de entregado (stock permanece 1) y dos calificaciones simultáneas (un registro, un conflicto), además de la regresión de compra.
- Frontend: `npm test`, `npm run build`, `npm run test:sprints56` y `npm run test:browser`.
- El ensayo de navegador cubre compradores/vendedores, error y reintento de perfil, recarga, fotografía, pantalla de 320 px, cancelación y calificación persistida. API/Auth/Storage están simuladas en este ensayo.

Evidencias ficticias en [evidencias/sprints-05-06](evidencias/sprints-05-06): `concurrencia.json`, `interfaz.json` y capturas de perfil, cancelación y calificación. La aceptación completa con Auth, PostgREST y Storage remotos sigue pendiente; los ensayos locales no acreditan despliegue ni carga de producción.
