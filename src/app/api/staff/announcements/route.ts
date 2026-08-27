import { getCurrentUser } from "@/lib/auth/session";
import { requireSiteAdmin } from "@/lib/auth/authorize";
import { createAnnouncementSchema } from "@/lib/validation/staff";
import { createAnnouncement, listAnnouncements } from "@/lib/services/announcements";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/response";
import { isSameOriginRequest } from "@/lib/api/csrf";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const announcements = await listAnnouncements();
  return jsonOk({ announcements });
});

export const POST = withErrorHandling(async (req: Request) => {
  if (!isSameOriginRequest(req)) return jsonError("Invalid request origin", 403);

  const user = await getCurrentUser();
  if (!user) return jsonError("Not authenticated", 401);
  requireSiteAdmin(user);

  const body = createAnnouncementSchema.parse(await req.json());
  const announcement = await createAnnouncement({
    title: body.title,
    body: body.body || undefined,
    link: body.link || undefined,
    sentBy: user.id,
  });

  return jsonOk({ announcement }, 201);
});
