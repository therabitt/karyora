import { z } from "zod";
import type {
  ArtworkCategory,
  ArtworkMedium,
  ArtworkStatus,
  CommissionAvailability,
  InquiryStatus,
} from "./database.types";

// Category and Medium constants
export const ARTWORK_CATEGORIES: [ArtworkCategory, ...ArtworkCategory[]] = [
  "original-character",
  "fan-art",
  "portrait",
  "landscape",
  "other",
];

export const ARTWORK_MEDIUMS: [ArtworkMedium, ...ArtworkMedium[]] = [
  "digital-painting",
  "pixel-art",
  "vector",
  "traditional",
  "mixed-media",
  "other",
];

export const ARTWORK_STATUSES: [ArtworkStatus, ...ArtworkStatus[]] = [
  "draft",
  "published",
];

export const COMMISSION_AVAILABILITIES: [CommissionAvailability, ...CommissionAvailability[]] = [
  "open",
  "waitlist",
  "closed",
];

export const INQUIRY_STATUSES: [InquiryStatus, ...InquiryStatus[]] = [
  "new",
  "reviewing",
  "accepted",
  "declined",
  "completed",
];

/**
 * Returns allowed next statuses for a given current status according to
 * Section 5.4.5 and the database trigger inquiry_validate_status_transition.
 */
export function getPermittedStatusTransitions(currentStatus: InquiryStatus): InquiryStatus[] {
  switch (currentStatus) {
    case "new":
      return ["reviewing", "accepted", "declined"];
    case "reviewing":
      return ["accepted", "declined"];
    case "accepted":
      return ["reviewing", "declined", "completed"];
    case "declined":
      return ["reviewing"];
    case "completed":
      return ["accepted"];
    default:
      return [];
  }
}

// Zod schemas for input validation
export const artworkInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or less"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160, "Slug must be 160 characters or less")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z
    .string()
    .max(4000, "Description must be 4,000 characters or less")
    .default(""),
  alt_text: z
    .string()
    .trim()
    .min(1, "Alt text is required for accessibility")
    .max(250, "Alt text must be 250 characters or less"),
  category: z.enum(ARTWORK_CATEGORIES).default("other"),
  medium: z.enum(ARTWORK_MEDIUMS).default("digital-painting"),
  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .max(30, "Tag must be 30 characters or less")
    )
    .max(20, "At most 20 tags permitted")
    .default([]),
  is_featured: z.boolean().default(false),
});

export type ArtworkInput = z.infer<typeof artworkInputSchema>;

export const offeringInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or less"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160, "Slug must be 160 characters or less")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z
    .string()
    .max(2000, "Description must be 2,000 characters or less")
    .default(""),
  price_from: z.number().nonnegative("Starting price must be non-negative").nullable().optional(),
  price_currency: z.string().length(3).default("IDR"),
  is_active: z.boolean().default(true),
  display_order: z.number().int().nonnegative().default(0),
});

export type OfferingInput = z.infer<typeof offeringInputSchema>;

export const inquirySubmissionSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  client_email: z
    .string()
    .trim()
    .email("A valid email address is required")
    .max(254, "Email must be 254 characters or less"),
  offering_id: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .min(20, "Project brief must be at least 20 characters")
    .max(4000, "Project brief must be 4,000 characters or less"),
  budget_amount: z
    .number()
    .nonnegative("Budget must be non-negative")
    .nullable()
    .optional(),
  budget_currency: z.string().length(3).default("IDR"),
  desired_deadline: z.string().nullable().optional(),
  // Honeypot field: must be empty for human submissions
  hp_website_contact: z.string().max(0, "Invalid submission detected").optional(),
});

export type InquirySubmissionInput = z.infer<typeof inquirySubmissionSchema>;

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be 80 characters or less"),
  bio: z
    .string()
    .max(2000, "Bio must be 2,000 characters or less")
    .default(""),
  contact_email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(254)
    .nullable()
    .optional(),
  social_links: z.record(z.string(), z.string().url("Must be a valid HTTPS URL")).default({}),
  commission_availability: z.enum(COMMISSION_AVAILABILITIES).default("open"),
  availability_message: z
    .string()
    .max(300, "Availability message must be 300 characters or less")
    .default(""),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const inquiryStatusUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
  admin_notes: z
    .string()
    .max(4000, "Admin notes must be 4,000 characters or less")
    .nullable()
    .optional(),
});

export type InquiryStatusUpdateInput = z.infer<typeof inquiryStatusUpdateSchema>;

export const paletteMetadataSchema = z.object({
  rearColor: z.string(),
  abstractBg: z.string(),
  middleBgColor: z.string(),
  patternType: z.enum([
    "topographic",
    "geometric",
    "botanical",
    "astrolabe",
    "filigree",
    "horizon",
    "minimal",
  ]),
  accentColor: z.string(),
  subtleLineColor: z.string(),
  plateTag: z.string(),
  temperature: z.enum(["warm", "cool", "neutral"]).default("neutral"),
  harmonyScore: z.number().default(100),
  uniquenessDistance: z.number().default(0.15),
  strategyUsed: z.string().optional(),
  clusters: z
    .array(
      z.object({
        hex: z.string(),
        proportion: z.number(),
        isNeutral: z.boolean(),
      })
    )
    .optional(),
  manualOverride: z.boolean().optional(),
});

export type PaletteMetadata = z.infer<typeof paletteMetadataSchema>;

