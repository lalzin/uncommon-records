import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";

export const POST = requireRole("ADMIN", "ARTIST")(async (req, { user }) => {
  const form = await req.formData();
  const file = form.get("avatar");
  if (!(file instanceof File) || !file.name) return error("No file provided", 400);
  if (!allowedFile(file.name, IMAGE_EXT)) return error("Invalid image type", 400);

  await deleteFile(user.avatar);
  const avatar = await saveImage(file, "avatars", [400, 400]);
  await prisma.user.update({ where: { id: user.id }, data: { avatar } });
  return json({ avatar });
});
