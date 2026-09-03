import { z } from "zod";

// Shared between the registration Server Actions and (if reused later)
// any client-side form validation.

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const password = z.string().min(8, "Password must be at least 8 characters.");
const name = z.string().trim().min(2, "Enter your full name.");
// Loose Nigerian phone check: optional +234 or leading 0, then 10 digits.
const phone = z
  .string()
  .trim()
  .regex(/^(\+234|0)\d{10}$/, "Enter a valid Nigerian phone number, e.g. 08012345678.");

export const passwordResetRequestSchema = z.object({ email });

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid."),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Those passwords don't match.",
    path: ["confirmPassword"],
  });

export const exporterRegisterSchema = z.object({
  name,
  email,
  phone,
  password,
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export const logisticsRegisterSchema = z.object({
  name,
  email,
  phone,
  password,
  companyName: z.string().trim().min(2, "Enter your company name."),
  anclaNumber: z.string().trim().min(4, "Enter a valid ANCLA number."),
  address: z.string().trim().min(4, "Enter your business address."),
  location: z.string().trim().min(2, "Enter your state/city."),
});

// What a logistics company may change about itself after signing up.
// Deliberately excludes anclaNumber (it's what verification was granted
// against), verificationStatus, and shipmentCount — a company vouching for
// its own shipment volume would be a trust claim, not a fact, so it stays
// out of self-service.
export const logisticsProfileUpdateSchema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name."),
  address: z.string().trim().min(4, "Enter your business address."),
  location: z.string().trim().min(2, "Enter your state/city."),
  establishedYear: z
    .union([z.literal(""), z.coerce.number().int().min(1900, "Year looks too early.").max(new Date().getFullYear(), "Year can't be in the future.")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});
