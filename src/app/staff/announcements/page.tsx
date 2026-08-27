import { listAnnouncements } from "@/lib/services/announcements";
import { StaffAnnouncementsManager } from "@/components/staff/staff-announcements-manager";

export const metadata = { title: "Announcements · Staff" };

export default async function StaffAnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Broadcast a notification to every member of every workspace on this instance.</p>
      </div>
      <StaffAnnouncementsManager
        initialAnnouncements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          link: a.link,
          recipientCount: a.recipientCount,
          createdAt: a.createdAt.toISOString(),
          sentByName: a.sentByName,
        }))}
      />
    </div>
  );
}
