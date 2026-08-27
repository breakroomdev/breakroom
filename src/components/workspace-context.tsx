"use client";

import * as React from "react";
import type { Permission } from "@/lib/permissions";

export interface WorkspaceContextValue {
  /** Path prefix for in-app links — "" on the workspace's own subdomain, "/{slug}" otherwise. */
  basePath: string;
  workspace: { id: string; name: string; slug: string; logoUrl: string | null; theme: string; verifiedAt: string | null };
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; isSiteAdmin: boolean };
  role: { key: string; name: string };
  permissions: Permission[];
  unreadNotifications: number;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ value, children }: { value: WorkspaceContextValue; children: React.ReactNode }) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}

export function useHasPermission(permission: Permission): boolean {
  const { permissions } = useWorkspace();
  return permissions.includes(permission);
}
