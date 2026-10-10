import { createHash } from "node:crypto";

function assertResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

export function createSupabaseDemoRepository(db) {
  return {
    async ensureUser(_key, { email, password, profile }) {
      const listed = assertResult(await db.auth.admin.listUsers({ page: 1, perPage: 1000 }), "Listar usuarios");
      let user = listed.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        const created = assertResult(await db.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { nombre: profile.nombre, rol: profile.rol, telefono: profile.telefono },
        }), `Crear ${email}`);
        user = created.user;
      } else {
        const updated = assertResult(await db.auth.admin.updateUserById(user.id, {
          password, email_confirm: true,
          user_metadata: { nombre: profile.nombre, rol: profile.rol, telefono: profile.telefono },
        }), `Actualizar ${email}`);
        user = updated.user;
      }
      assertResult(await db.from("perfiles").upsert({ id: user.id, correo: email, ...profile }), `Perfil ${email}`);
      return { id: user.id, email };
    },

    async ensureCategories(names) {
      assertResult(await db.from("categorias").upsert(names.map((nombre) => ({ nombre, activa: true })), { onConflict: "nombre" }), "Categorías");
      const rows = assertResult(await db.from("categorias").select("id, nombre").in("nombre", names), "Consultar categorías");
      return Object.fromEntries(rows.map((row) => [row.nombre, row.id]));
    },

    async ensureProduct(_key, data) {
      const found = assertResult(await db.from("productos").select("id").eq("vendedor_id", data.vendedor_id).eq("nombre", data.nombre).maybeSingle(), `Buscar ${data.nombre}`);
      if (found) {
        const { categoria_id, fecha_vencimiento, peso_unidad_kg, ...editables } = data;
        return assertResult(await db.from("productos").update(editables).eq("id", found.id).select().single(), `Actualizar ${data.nombre}`);
      }
      const product = assertResult(await db.from("productos").insert({ ...data, stock: Math.max(1, data.stock) }).select().single(), `Crear ${data.nombre}`);
      if (data.stock === 0) return assertResult(await db.from("productos").update({ stock: 0 }).eq("id", product.id).select().single(), `Stock ${data.nombre}`);
      return product;
    },

    async ensureOrder(key, data) {
      const hash = createHash("sha256").update(`orbika-demo:${data.comprador_id}:${key}`).digest("hex");
      const clave = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
      data = { ...data, clave_idempotencia: clave };
      const found = assertResult(await db.from("pedidos").select("id").eq("comprador_id", data.comprador_id).eq("clave_idempotencia", clave).maybeSingle(), `Buscar pedido ${key}`);
      if (found) return assertResult(await db.from("pedidos").update(data).eq("id", found.id).select().single(), `Actualizar pedido ${key}`);
      return assertResult(await db.from("pedidos").insert(data).select().single(), `Crear pedido ${key}`);
    },

    async replaceOrderDetail(orderId, data) {
      assertResult(await db.from("detalle_pedidos").upsert({ pedido_id: orderId, ...data }, { onConflict: "pedido_id" }), `Guardar detalle ${orderId}`);
    },

    async ensureRating(orderId, data) {
      assertResult(await db.from("calificaciones").upsert({ pedido_id: orderId, ...data }, { onConflict: "pedido_id" }), "Calificación demo");
    },

    async replaceNotifications(data) {
      assertResult(await db.from("notificaciones").delete().like("mensaje", "[DEMO]%"), "Limpiar notificaciones demo");
      assertResult(await db.from("notificaciones").insert(data), "Notificaciones demo");
    },
  };
}

