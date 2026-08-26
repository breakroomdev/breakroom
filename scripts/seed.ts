import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import { ROLE_PRESETS } from "../src/lib/permissions";

const url = process.env.DATABASE_URL ?? "file:./sqlite.db";
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client, { schema });

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  console.log("Seeding Breakroom demo data...\n");

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("- Creating users");
  const people = [
    { username: "jordan", displayName: "Jordan Lee", email: "jordan@acme.test", jobTitle: "General Manager", department: "Leadership", bio: "Been with Acme since day one. Ask me anything about scheduling.", pronouns: "she/her", roleKey: "owner" },
    { username: "sam", displayName: "Sam Rivera", email: "sam@acme.test", jobTitle: "Assistant Manager", department: "Leadership", bio: "Here to keep the trains running on time.", pronouns: "they/them", roleKey: "admin" },
    { username: "casey", displayName: "Casey Kim", email: "casey@acme.test", jobTitle: "Shift Supervisor", department: "Operations", bio: "Coffee enthusiast. Building the best schedule for everyone.", pronouns: "she/her", roleKey: "manager" },
    { username: "alex", displayName: "Alex Chen", email: "alex@acme.test", jobTitle: "Sales Associate", department: "Front of House", bio: "New here, excited to meet everyone!", pronouns: "he/him", roleKey: "employee" },
    { username: "morgan", displayName: "Morgan Davis", email: "morgan@acme.test", jobTitle: "Cashier", department: "Front of House", bio: null, pronouns: null, roleKey: "employee" },
    { username: "taylor", displayName: "Taylor Brooks", email: "taylor@acme.test", jobTitle: "Warehouse Associate", department: "Operations", bio: "Weightlifting on the weekends 💪", pronouns: "they/them", roleKey: "employee" },
    { username: "jamie", displayName: "Jamie Patel", email: "jamie@acme.test", jobTitle: "Sales Associate", department: "Front of House", bio: null, pronouns: "she/her", roleKey: "employee" },
  ] as const;

  const users: (typeof schema.users.$inferSelect)[] = [];
  for (const p of people) {
    const [user] = await db
      .insert(schema.users)
      .values({
        username: p.username,
        email: p.email,
        passwordHash,
        displayName: p.displayName,
        jobTitle: p.jobTitle,
        department: p.department,
        bio: p.bio,
        pronouns: p.pronouns,
      })
      .returning();
    if (!user) throw new Error("Failed to create user");
    users.push(user);
  }
  const [owner, admin, manager, alex, morgan, taylor, jamie] = users;
  if (!owner || !admin || !manager || !alex || !morgan || !taylor || !jamie) throw new Error("Seed user list incomplete");

  console.log("- Creating workspace");
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name: "Acme Retail", slug: "acme", description: "Your friendly neighborhood retail crew.", theme: "ocean", ownerId: owner.id })
    .returning();
  if (!workspace) throw new Error("Failed to create workspace");

  console.log("- Creating roles");
  const roles: (typeof schema.roles.$inferSelect)[] = [];
  for (const [key, preset] of Object.entries(ROLE_PRESETS)) {
    const [role] = await db
      .insert(schema.roles)
      .values({ workspaceId: workspace.id, key, name: preset.name, permissions: preset.permissions, isSystem: preset.isSystem })
      .returning();
    if (role) roles.push(role);
  }
  const roleByKey = Object.fromEntries(roles.map((r) => [r.key, r]));

  console.log("- Adding memberships");
  for (const p of people) {
    const user = users[people.indexOf(p)]!;
    const role = roleByKey[p.roleKey];
    if (!role) continue;
    await db.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, roleId: role.id });
  }

  console.log("- Workspace settings");
  await db.insert(schema.workspaceSettings).values({ workspaceId: workspace.id });

  console.log("- Positions & locations");
  await db.insert(schema.positions).values([
    { workspaceId: workspace.id, name: "Cashier", color: "#3b82f6" },
    { workspaceId: workspace.id, name: "Stock", color: "#10b981" },
  ]);
  await db.insert(schema.locations).values([
    { workspaceId: workspace.id, name: "Downtown Store", address: "123 Main St" },
    { workspaceId: workspace.id, name: "Warehouse", address: "88 Industrial Way" },
  ]);

  console.log("- Posts, comments, reactions");

  const [announcement] = await db
    .insert(schema.posts)
    .values({
      workspaceId: workspace.id,
      authorId: owner.id,
      type: "announcement",
      content: "🎉 Huge shoutout to the weekend crew — we hit our best Saturday numbers this quarter! Drinks on the house Friday after close.",
      isPinned: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    })
    .returning();

  const [textPost] = await db
    .insert(schema.posts)
    .values({
      workspaceId: workspace.id,
      authorId: manager.id,
      type: "text",
      content: "Reminder: the new POS training video is up in the shared drive. Please watch it before your next shift!",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    })
    .returning();

  const [imagePost] = await db
    .insert(schema.posts)
    .values({
      workspaceId: workspace.id,
      authorId: alex.id,
      type: "image",
      content: "New window display is up! What do you all think? 👀",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    })
    .returning();
  if (imagePost) {
    await db.insert(schema.postImages).values({
      postId: imagePost.id,
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      width: 1200,
      height: 800,
      position: 0,
    });
  }

  const [pollPost] = await db
    .insert(schema.posts)
    .values({ workspaceId: workspace.id, authorId: admin.id, type: "poll", content: "Which snacks should we restock for the break room?", createdAt: daysAgo(1), updatedAt: daysAgo(1) })
    .returning();

  if (pollPost) {
    const [poll] = await db
      .insert(schema.polls)
      .values({ postId: pollPost.id, question: "Which snacks should we restock for the break room?", allowMultiple: false, expiresAt: daysFromNow(5) })
      .returning();
    if (poll) {
      const [opt1] = await db.insert(schema.pollOptions).values({ pollId: poll.id, text: "Pretzels", position: 0 }).returning();
      const [opt2] = await db.insert(schema.pollOptions).values({ pollId: poll.id, text: "Trail mix", position: 1 }).returning();
      const [opt3] = await db.insert(schema.pollOptions).values({ pollId: poll.id, text: "Granola bars", position: 2 }).returning();
      const votes = [
        { user: owner, option: opt1 },
        { user: admin, option: opt1 },
        { user: manager, option: opt2 },
        { user: alex, option: opt1 },
        { user: morgan, option: opt3 },
        { user: taylor, option: opt1 },
      ];
      for (const v of votes) {
        if (v.option) await db.insert(schema.pollVotes).values({ pollId: poll.id, optionId: v.option.id, userId: v.user.id });
      }
    }
  }

  if (announcement) {
    await db.insert(schema.comments).values([
      { postId: announcement.id, authorId: admin.id, content: "Team effort! 🙌", createdAt: daysAgo(2) },
      { postId: announcement.id, authorId: alex.id, content: "Let's keep it going this weekend!", createdAt: daysAgo(1) },
    ]);
    await db.insert(schema.reactions).values([
      { postId: announcement.id, userId: admin.id, emoji: "🎉" },
      { postId: announcement.id, userId: manager.id, emoji: "❤️" },
      { postId: announcement.id, userId: alex.id, emoji: "🎉" },
      { postId: announcement.id, userId: morgan.id, emoji: "👏" },
    ]);
  }

  if (textPost) {
    await db.insert(schema.reactions).values([{ postId: textPost.id, userId: alex.id, emoji: "👍" }]);
  }

  console.log("- Shifts");
  const today = new Date();
  const shiftPlan: { user: typeof owner; offset: number; start: string; end: string; role: string; location: string; color: string }[] = [
    { user: alex, offset: 0, start: "09:00", end: "17:00", role: "Cashier", location: "Downtown Store", color: "#3b82f6" },
    { user: morgan, offset: 0, start: "12:00", end: "20:00", role: "Cashier", location: "Downtown Store", color: "#3b82f6" },
    { user: taylor, offset: 1, start: "08:00", end: "16:00", role: "Stock", location: "Warehouse", color: "#10b981" },
    { user: jamie, offset: 2, start: "09:00", end: "17:00", role: "Cashier", location: "Downtown Store", color: "#3b82f6" },
    { user: alex, offset: 3, start: "09:00", end: "17:00", role: "Cashier", location: "Downtown Store", color: "#3b82f6" },
    { user: manager, offset: 4, start: "10:00", end: "18:00", role: "Supervisor", location: "Downtown Store", color: "#f59e0b" },
    { user: taylor, offset: 5, start: "08:00", end: "16:00", role: "Stock", location: "Warehouse", color: "#10b981" },
  ];
  for (const s of shiftPlan) {
    await db.insert(schema.shifts).values({
      workspaceId: workspace.id,
      userId: s.user.id,
      date: isoDate(new Date(today.getTime() + s.offset * 24 * 60 * 60 * 1000)),
      startTime: s.start,
      endTime: s.end,
      role: s.role,
      location: s.location,
      color: s.color,
      createdBy: owner.id,
    });
  }
  // one open/unassigned shift
  await db.insert(schema.shifts).values({
    workspaceId: workspace.id,
    userId: null,
    date: isoDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
    startTime: "16:00",
    endTime: "22:00",
    role: "Cashier",
    location: "Downtown Store",
    color: "#ef4444",
    notes: "Needs coverage — please pick up if you can!",
    createdBy: owner.id,
  });

  console.log("- Notifications");
  await db.insert(schema.notifications).values([
    { workspaceId: workspace.id, userId: alex.id, actorId: admin.id, type: "comment", title: "Sam Rivera commented on your post", body: "Nice display!", link: `/${workspace.slug}/feed`, isRead: false, createdAt: daysAgo(1) },
    { workspaceId: workspace.id, userId: alex.id, actorId: owner.id, type: "shift_assigned", title: "You've been scheduled for a new shift", body: "Today · 9:00 AM–5:00 PM", link: `/${workspace.slug}/schedule`, isRead: false, createdAt: daysAgo(0) },
    { workspaceId: workspace.id, userId: alex.id, actorId: morgan.id, type: "reaction", title: "Morgan Davis reacted 👍 to your post", link: `/${workspace.slug}/feed`, isRead: true, createdAt: daysAgo(3) },
  ]);

  console.log("\nDone! Demo workspace: /acme");
  console.log("Sign in with any of these accounts (password: password123):");
  for (const p of people) console.log(`  - ${p.username} (${p.roleKey})`);

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
