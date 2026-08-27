import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div>
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 27, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. What we collect</h2>
            <p className="mt-2">
              To run your account and workspace, we store: your name, username, and email; a securely hashed password
              (if you use password sign-in) or your Discord account ID and username (if you use Discord sign-in);
              profile details you add (job title, department, pronouns, avatar); and the content you create — posts,
              comments, reactions, poll votes, and shift/schedule data. Uploaded images are stored by Cloudinary, our
              image hosting provider.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. How we use it</h2>
            <p className="mt-2">
              Your data is used to operate Breakroom for you and your workspace: authenticating you, displaying your
              posts and profile to co-workers in the same workspace, sending in-app notifications, and running
              features like scheduling and polls. We don't sell your data or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Sessions & cookies</h2>
            <p className="mt-2">
              We use a single essential cookie to keep you signed in (a session token). We don't use third-party
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Discord sign-in</h2>
            <p className="mt-2">
              If you sign in with Discord, we receive your Discord user ID, username, and avatar from Discord's OAuth2
              API to create or match your account. We don't receive your Discord password, and we don't post to
              Discord or access your Discord messages or servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Who can see your data</h2>
            <p className="mt-2">
              Your profile and posts are visible to other members of the same workspace, subject to that workspace's
              own roles and permissions. Workspace admins can see membership and moderation data for their workspace.
              We don't share your data with other workspaces or outside organizations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. Data retention & deletion</h2>
            <p className="mt-2">
              We retain your data for as long as your account or workspace exists. You can ask a workspace admin to
              remove you from a workspace, or contact the instance operator to request deletion of your account and
              associated data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Third parties</h2>
            <p className="mt-2">
              We use Cloudinary for image storage and, optionally, Discord for authentication. Each has its own
              privacy policy governing the data it processes on our behalf.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="mt-2">
              Questions about this policy or your data? Reach out to the person or organization operating this
              Breakroom instance.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
