import { describe, expect, it } from "vitest";
import { seedDemo } from "../../src/demo/seed-demo.js";

function memoryRepository() {
  const state = {
    users: new Map(), categories: new Map(), products: new Map(), orders: new Map(),
    details: new Map(), ratings: new Map(), notifications: [], nextId: 1,
  };
  const id = () => state.nextId++;
  return {
    state,
    async ensureUser(key, data) { if (!state.users.has(key)) state.users.set(key, { id: key, ...data }); return state.users.get(key); },
    async ensureCategories(names) { for (const name of names) if (!state.categories.has(name)) state.categories.set(name, { id: id(), nombre: name }); return Object.fromEntries([...state.categories].map(([n, v]) => [n, v.id])); },
    async ensureProduct(key, data) { if (!state.products.has(key)) state.products.set(key, { id: id(), ...data }); else Object.assign(state.products.get(key), data); return state.products.get(key); },
    async ensureOrder(key, data) { if (!state.orders.has(key)) state.orders.set(key, { id: id(), ...data }); else Object.assign(state.orders.get(key), data); return state.orders.get(key); },
    async replaceOrderDetail(orderId, data) { state.details.set(orderId, data); },
    async ensureRating(orderId, data) { state.ratings.set(orderId, data); },
    async replaceNotifications(data) { state.notifications = data; },
  };
}

describe("seed de demostración", () => {
  it("crea usuarios, categorías, ocho productos, cinco pedidos y contenido relacionado", async () => {
    const repo = memoryRepository();
    const result = await seedDemo({ repo, now: new Date("2026-10-03T12:00:00Z") });
    expect(result).toEqual({ usuarios: 2, categorias: 6, productos: 8, pedidos: 5, calificaciones: 1, notificaciones: 3 });
    expect(repo.state.products.size).toBe(8);
    expect(repo.state.orders.size).toBe(5);
    expect(repo.state.ratings.size).toBe(1);
  });

  it("puede ejecutarse dos veces sin duplicar datos", async () => {
    const repo = memoryRepository();
    await seedDemo({ repo, now: new Date("2026-10-03T12:00:00Z") });
    const first = {
      users: repo.state.users.size, products: repo.state.products.size, orders: repo.state.orders.size,
      details: repo.state.details.size, ratings: repo.state.ratings.size, notifications: repo.state.notifications.length,
    };
    await seedDemo({ repo, now: new Date("2026-10-03T12:00:00Z") });
    expect({
      users: repo.state.users.size, products: repo.state.products.size, orders: repo.state.orders.size,
      details: repo.state.details.size, ratings: repo.state.ratings.size, notifications: repo.state.notifications.length,
    }).toEqual(first);
  });
});
