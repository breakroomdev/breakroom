"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border bg-card text-card-foreground shadow-popover font-sans animate-toast-in",
          title: "font-medium text-sm",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "!text-success",
          error: "!text-destructive",
        },
      }}
    />
  );
}
