import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div>
      <MarketingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 27, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">1. What Breakroom is</h2>
            <p className="mt-2">
              Breakroom is an open-source workplace communication platform. This deployment is a hosted instance of that
              software, provided as-is, for use by the workspaces and members invited to it. Breakroom is also freely
              available as open-source software that anyone can self-host under its own terms — the terms below apply
              only to this particular hosted instance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">2. Accounts</h2>
            <p className="mt-2">
              You're responsible for the activity on your account and for keeping your credentials secure. You may sign
              in with a username and password or via Discord OAuth. You must provide accurate information when
              registering and are responsible for anything posted under your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">3. Workspaces & content</h2>
            <p className="mt-2">
              A workspace is created and administered by its own owners/admins, who control membership, roles, and
              settings for that workspace. Content you post (feed posts, comments, images, poll responses, profile
              info) is visible to other members of the same workspace according to that workspace's settings. Don't
              post anything unlawful, abusive, or that you don't have the right to share.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">4. Acceptable use</h2>
            <p className="mt-2">
              Don't use Breakroom to harass others, distribute malware, attempt to bypass access controls, or disrupt
              the service. Workspace admins may remove content or members that violate their own workspace's rules;
              the instance operator may suspend accounts or workspaces that violate these terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">5. Third-party services</h2>
            <p className="mt-2">
              Image uploads are processed by Cloudinary. Sign-in can optionally go through Discord's OAuth2 service.
              Use of those features is also subject to Discord's and Cloudinary's own terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">6. No warranty</h2>
            <p className="mt-2">
              This service is provided "as is," without warranties of any kind. We do our best to keep it running and
              your data intact, but we don't guarantee uninterrupted availability.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">7. Changes</h2>
            <p className="mt-2">
              These terms may be updated from time to time; the "last updated" date above will reflect the most recent
              change. Continued use of the service after a change means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">8. Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach out to the person or organization operating this Breakroom instance.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
