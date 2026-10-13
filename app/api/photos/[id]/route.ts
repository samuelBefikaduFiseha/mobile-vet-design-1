import { getCurrentUser } from "@/lib/auth";
import { getPhotoForUser } from "@/lib/photos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/photos/:id[?size=thumb] — only for signed-in users who can see the owning record.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const size = new URL(request.url).searchParams.get("size") === "thumb" ? "thumb" : "full";
  const photo = await getPhotoForUser(user, id, size);
  if (!photo) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.content_type,
      // Photos never change once uploaded (a new upload gets a new id); keep them in the
      // browser's private cache only, since they are personal data.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
