import { Router, raw } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { subirImagen } from "../services/imagen.service.js";

const router = Router();
router.post("/", requireAuth, requireRole("vendedor"), raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }), async (req, res, next) => {
  try {
    const imagen = await subirImagen(req.perfil, req.body, req.get("content-type")?.split(";")[0]);
    res.status(201).json(imagen);
  } catch (error) { next(error); }
});
export default router;
