import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format");

const shiftShape = {
  userId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  startTime: timeSchema,
  endTime: timeSchema,
  location: z.string().max(120).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
};

function validTimeRange(data: { startTime: string; endTime: string }) {
  return data.startTime < data.endTime;
}

export const createShiftSchema = z.object(shiftShape).refine(validTimeRange, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateShiftSchema = z
  .object(shiftShape)
  .partial()
  .refine((data) => (data.startTime && data.endTime ? validTimeRange({ startTime: data.startTime, endTime: data.endTime }) : true), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const positionSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().max(20).default("#3b82f6"),
});

export const locationSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(300).optional().nullable(),
});
