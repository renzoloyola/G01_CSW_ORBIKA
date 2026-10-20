import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { AppError } from "../errors/AppError.js";

export async function subirImagen(actor, bytes, mime, db = supabaseAdmin) {
  if (actor?.rol !== "vendedor" || actor.activo === false) {
    throw new AppError(403, "FORBIDDEN", "Solo un vendedor habilitado puede subir imágenes.");
  }
  if (!Buffer.isBuffer(bytes) || !bytes.length) {
    throw new AppError(400, "INVALID_IMAGE", "Debes enviar una imagen JPG o PNG.");
  }
  if (bytes.length > 5 * 1024 * 1024) {
    throw new AppError(413, "IMAGE_TOO_LARGE", "La imagen no puede superar 5 MB.");
  }
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!((mime === "image/png" && png) || (mime === "image/jpeg" && jpeg))) {
    throw new AppError(400, "INVALID_IMAGE", "El archivo debe ser JPG o PNG y coincidir con su formato.");
  }
  const path = `${actor.id}/${randomUUID()}.${png ? "png" : "jpg"}`;
  const bucket = db.storage.from("orbika-productos");
  const { error } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new AppError(502, "IMAGE_UPLOAD_FAILED", "No se pudo almacenar la imagen. Intenta nuevamente.");
  const { data } = bucket.getPublicUrl(path);
  return { url: data.publicUrl };
}
