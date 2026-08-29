import { notFound } from "next/navigation";
import { getHelpArticleById } from "@/lib/services/help";
import { StaffHelpArticleEditor } from "@/components/staff/staff-help-article-editor";

export const metadata = { title: "Edit Help Article · Staff" };

export default async function EditStaffHelpArticlePage({ params }: { params: { id: string } }) {
  const article = await getHelpArticleById(params.id);
  if (!article) notFound();

  return (
    <StaffHelpArticleEditor
      initial={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        category: article.category,
        status: article.status,
      }}
    />
  );
}
