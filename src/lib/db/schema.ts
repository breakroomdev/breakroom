import { relations, sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
};

// ─────────────────────────────────────────────────────────────
// Users & authentication
// ─────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  jobTitle: text("job_title"),
  department: text("department"),
  pronouns: text("pronouns"),
  phone: text("phone"),
  colorMode: text("color_mode", { enum: ["light", "dark", "system"] }).notNull().default("system"),
  themeOverride: text("theme_override"),
  isSiteAdmin: integer("is_site_admin", { mode: "boolean" }).notNull().default(false),
  disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  })
);

export const oauthAccounts = sqliteTable(
  "oauth_accounts",
  {
    id: id(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["discord"] }).notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    providerUsername: text("provider_username"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    providerAccountIdx: uniqueIndex("oauth_provider_account_idx").on(t.provider, t.providerAccountId),
  })
);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────────────────────────
// Workspaces, membership, roles
// ─────────────────────────────────────────────────────────────

export const workspaces = sqliteTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  theme: text("theme").notNull().default("default"),
  ...timestamps,
});

export const workspaceSettings = sqliteTable("workspace_settings", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  authPasswordEnabled: integer("auth_password_enabled", { mode: "boolean" }).notNull().default(true),
  authDiscordEnabled: integer("auth_discord_enabled", { mode: "boolean" }).notNull().default(false),
  discordClientId: text("discord_client_id"),
  discordClientSecret: text("discord_client_secret"),
  discordRedirectUri: text("discord_redirect_uri"),
  allowSelfRegistration: integer("allow_self_registration", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const roles = sqliteTable(
  "roles",
  {
    id: id(),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    workspaceKeyIdx: uniqueIndex("roles_workspace_key_idx").on(t.workspaceId, t.key),
  })
);

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id").notNull().references(() => roles.id),
    status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    workspaceUserIdx: uniqueIndex("workspace_members_workspace_user_idx").on(t.workspaceId, t.userId),
    workspaceIdx: index("workspace_members_workspace_idx").on(t.workspaceId),
  })
);

export const invites = sqliteTable(
  "invites",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: text("role_id").notNull().references(() => roles.id),
    tokenHash: text("token_hash").notNull(),
    invitedBy: text("invited_by").notNull().references(() => users.id),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    workspaceIdx: index("invites_workspace_idx").on(t.workspaceId),
  })
);

// ─────────────────────────────────────────────────────────────
// Feed: posts, images, comments, reactions
// ─────────────────────────────────────────────────────────────

export const posts = sqliteTable(
  "posts",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["text", "image", "announcement", "poll", "schedule"] }).notNull().default("text"),
    content: text("content"),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    commentsEnabled: integer("comments_enabled", { mode: "boolean" }).notNull().default(true),
    shiftId: text("shift_id"),
    editedAt: integer("edited_at", { mode: "timestamp_ms" }),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => ({
    workspaceIdx: index("posts_workspace_idx").on(t.workspaceId, t.createdAt),
    pinnedIdx: index("posts_pinned_idx").on(t.workspaceId, t.isPinned),
  })
);

export const postImages = sqliteTable(
  "post_images",
  {
    id: id(),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    publicId: text("public_id"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
  },
  (t) => ({
    postIdx: index("post_images_post_idx").on(t.postId),
  })
);

export const comments = sqliteTable(
  "comments",
  {
    id: id(),
    postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => ({
    postIdx: index("comments_post_idx").on(t.postId, t.createdAt),
  })
);

export const reactions = sqliteTable(
  "reactions",
  {
    id: id(),
    postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: text("comment_id").references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull().default("👍"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    postUserIdx: uniqueIndex("reactions_post_user_idx").on(t.postId, t.userId),
    commentUserIdx: uniqueIndex("reactions_comment_user_idx").on(t.commentId, t.userId),
  })
);

export const reports = sqliteTable(
  "reports",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post", "comment", "poll"] }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
    resolvedBy: text("resolved_by").references(() => users.id),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    workspaceIdx: index("reports_workspace_idx").on(t.workspaceId, t.status),
  })
);

// ─────────────────────────────────────────────────────────────
// Polls
// ─────────────────────────────────────────────────────────────

export const polls = sqliteTable("polls", {
  id: id(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }).unique(),
  question: text("question").notNull(),
  allowMultiple: integer("allow_multiple", { mode: "boolean" }).notNull().default(false),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const pollOptions = sqliteTable(
  "poll_options",
  {
    id: id(),
    pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => ({
    pollIdx: index("poll_options_poll_idx").on(t.pollId),
  })
);

export const pollVotes = sqliteTable(
  "poll_votes",
  {
    id: id(),
    pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
    optionId: text("option_id").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    optionUserIdx: uniqueIndex("poll_votes_option_user_idx").on(t.optionId, t.userId),
    pollIdx: index("poll_votes_poll_idx").on(t.pollId),
  })
);

// ─────────────────────────────────────────────────────────────
// Hub — admin-curated links, opened as an in-page embed or new tab
// ─────────────────────────────────────────────────────────────

export const hubLinks = sqliteTable(
  "hub_links",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    openMode: text("open_mode", { enum: ["embed", "new_tab"] }).notNull().default("new_tab"),
    position: integer("position").notNull().default(0),
    createdBy: text("created_by").notNull().references(() => users.id),
    ...timestamps,
  },
  (t) => ({
    workspaceIdx: index("hub_links_workspace_idx").on(t.workspaceId, t.position),
  })
);

// ─────────────────────────────────────────────────────────────
// Scheduling
// ─────────────────────────────────────────────────────────────

export const positions = sqliteTable("positions", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
});

export const locations = sqliteTable("locations", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
});

export const shifts = sqliteTable(
  "shifts",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:mm
    endTime: text("end_time").notNull(), // HH:mm
    location: text("location"),
    role: text("role"),
    notes: text("notes"),
    color: text("color").default("#3b82f6"),
    createdBy: text("created_by").notNull().references(() => users.id),
    ...timestamps,
  },
  (t) => ({
    workspaceDateIdx: index("shifts_workspace_date_idx").on(t.workspaceId, t.date),
    userIdx: index("shifts_user_idx").on(t.userId, t.date),
  })
);

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type", {
      enum: [
        "comment",
        "reaction",
        "mention",
        "shift_assigned",
        "shift_updated",
        "shift_removed",
        "poll_vote",
        "post_pinned",
        "report",
      ],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId, t.isRead, t.createdAt),
  })
);

// ─────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers),
  roles: many(roles),
  posts: many(posts),
  settings: one(workspaceSettings, { fields: [workspaces.id], references: [workspaceSettings.workspaceId] }),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
  role: one(roles, { fields: [workspaceMembers.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [roles.workspaceId], references: [workspaces.id] }),
  members: many(workspaceMembers),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  workspace: one(workspaces, { fields: [posts.workspaceId], references: [workspaces.id] }),
  images: many(postImages),
  comments: many(comments),
  reactions: many(reactions),
  poll: one(polls, { fields: [posts.id], references: [polls.postId] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  reactions: many(reactions),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  post: one(posts, { fields: [polls.postId], references: [posts.id] }),
  options: many(pollOptions),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, { fields: [pollOptions.pollId], references: [polls.id] }),
  votes: many(pollVotes),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  workspace: one(workspaces, { fields: [shifts.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [shifts.userId], references: [users.id] }),
}));
