# Actualización de Supabase — 24 de octubre de 2026

Se actualizó el proyecto `wcqvvwysriidclauvhtx` desde el esquema 001 hasta las
migraciones 002, 003 y 004, con autorización del propietario. La causa del error
en «Mis ventas» era la ausencia de la relación entre `detalle_pedidos` y
`productos`, que utiliza el backend actual.

## Conservación de datos

- Se conservaron 6 pedidos, 6 detalles y 9 productos.
- Se creó el esquema privado `orbika_respaldo_20261024` con copias de las siete
  tablas de negocio anteriores a la actualización. Sus tablas tienen RLS y no
  permiten acceso a los roles `anon` ni `authenticated`.
- La referencia antigua de cada pedido se conservó como `producto_id_legacy`.
  Las compras nuevas usan `detalle_pedidos.producto_id`.
- La actualización se ejecutó en una transacción con comprobaciones de conteos,
  referencias, importes, cantidades, estados y productos existentes.
- No se crearon compras ni publicaciones para efectuar las comprobaciones.

## Verificación

- 91 pruebas del backend aprobadas, incluidas las de migraciones en PostgreSQL.
- El script completo se ensayó localmente con un pedido antiguo; se comprobó
  además que las siete tablas de respaldo tienen RLS y acceso restringido.
- La API de Supabase reconoce la nueva relación de pedidos y las columnas
  `perfiles.activo` y `productos.estado_publicacion`.
- El catálogo local devuelve HTTP 200.
- «Mis ventas» carga correctamente con la sesión de carlitos y muestra que esa
  cuenta aún no tiene ventas registradas.

El script aplicado está en `../../output/orbika-actualizar-supabase-20261024.sql`.
Es una actualización de ejecución única: no debe repetirse sobre este proyecto.
Estas comprobaciones no equivalen a una prueba integral de compra y cancelación
con cuentas reales.
