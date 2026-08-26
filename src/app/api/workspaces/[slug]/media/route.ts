import { requireWorkspaceContext } from "@/lib/api/workspace-route";
import { listMedia } from "@/lib/services/media";
import { jsonOk, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: Request, { params }: { params: { slug: string } }) => {
  const { membership } = await requireWorkspaceContext(params.slug);
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  const result = await listMedia(membership.workspace.id, cursor ? Number(cursor) : null);
  return jsonOk(result);
});
