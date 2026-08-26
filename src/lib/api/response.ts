import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/authorize";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler so thrown errors become consistent JSON responses instead of leaking stack traces. */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return jsonError("Invalid request", 422, err.flatten());
      }
      if (err instanceof AuthError) {
        return jsonError(err.message, err.status);
      }
      if (err instanceof ForbiddenError) {
        return jsonError(err.message, err.status);
      }
      if (err instanceof Response) {
        return err;
      }

      console.error(err);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}
