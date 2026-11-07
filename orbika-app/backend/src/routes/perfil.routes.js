import { Router, raw } from "express";
import { subirFotoPerfil } from "../services/imagen.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { actualizarPerfil } from "../services/perfil.service.js";
const router = Router();
// Toda lectura y actualización del perfil requiere una sesión válida.
router.use(requireAuth);
// Recibe bytes de imagen directamente y aplica el límite antes de almacenarlos.
router.post("/foto", raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }), async (req, res, next) => {
  try { res.status(201).json(await subirFotoPerfil(req.perfil, req.body, req.get("content-type")?.split(";")[0])); }
  catch (error) { next(error); }
});
router.get("/", (req, res) => res.json(req.perfil));
// Actualiza solo los campos permitidos para el titular autenticado.
router.patch("/", async (req, res, next) => {
  try { res.json(await actualizarPerfil(req.perfil, req.body)); } catch (error) { next(error); }
});
export default router;
