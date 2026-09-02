import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string({ error: "Customer name is required" })
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name must be less than 100 characters"),
  phone: z
    .string({ error: "Customer phone is required" })
    .trim()
    .min(1, "Customer phone is required")
    .max(30, "Phone number must be less than 30 characters"),
  address: z
    .string({ error: "Address must be a string" })
    .trim()
    .max(255, "Address must be less than 255 characters")
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
  notes: z
    .string({ error: "Notes must be a string" })
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  id: z.coerce
    .number({ error: "Invalid customer ID" })
    .int("Invalid customer ID")
    .positive("Invalid customer ID"),
});

export const deleteCustomerSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid customer ID" })
    .int("Invalid customer ID")
    .positive("Invalid customer ID"),
});

export const customerSelectionSchema = z.object({
  query: z.string().optional().default(""),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(50)
    .default(10),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
