import { z } from "zod";

export const chequeStatusSchema = z.enum(["PENDING", "CLEARED", "BOUNCED"], {
  error: "Invalid cheque status",
});

export const chequeAmountSchema = z
  .string({ error: "Amount is required" })
  .trim()
  .min(1, "Amount is required")
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid cheque amount")
  .refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Cheque amount must be greater than zero" }
  );

export const chequeDateSchema = z
  .union([z.string(), z.date()])
  .refine(
    (val) => {
      if (val instanceof Date) {
        return !isNaN(val.getTime());
      }
      if (typeof val === "string" && val.trim().length > 0) {
        const date = new Date(`${val}T00:00:00.000Z`);
        return !isNaN(date.getTime());
      }
      return false;
    },
    { message: "Valid date is required" }
  )
  .transform((val) => {
    if (val instanceof Date) return val;
    return new Date(`${val}T00:00:00.000Z`);
  });

export const createChequeSchema = z.object({
  customerId: z.coerce
    .number({ error: "Invalid customer selected" })
    .int("Invalid customer selected")
    .positive("Invalid customer selected"),
  chequeNumber: z
    .string({ error: "Cheque number is required" })
    .trim()
    .min(1, "Cheque number is required")
    .max(50, "Cheque number must be less than 50 characters"),
  bank: z
    .string({ error: "Bank is required" })
    .trim()
    .min(1, "Bank is required")
    .max(100, "Bank name must be less than 100 characters"),
  amount: chequeAmountSchema,
  dueDate: chequeDateSchema,
  notes: z
    .string({ error: "Notes must be a string" })
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export const updateChequeSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid cheque ID" })
    .int("Invalid cheque ID")
    .positive("Invalid cheque ID"),
  chequeNumber: z
    .string({ error: "Cheque number is required" })
    .trim()
    .min(1, "Cheque number is required")
    .max(50, "Cheque number must be less than 50 characters"),
  bank: z
    .string({ error: "Bank is required" })
    .trim()
    .min(1, "Bank is required")
    .max(100, "Bank name must be less than 100 characters"),
  amount: chequeAmountSchema,
  dueDate: chequeDateSchema,
  status: chequeStatusSchema,
  notes: z
    .string({ error: "Notes must be a string" })
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .nullish()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export const updateChequeStatusSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid cheque ID" })
    .int("Invalid cheque ID")
    .positive("Invalid cheque ID"),
  status: chequeStatusSchema,
});

export const deleteChequeSchema = z.object({
  id: z.coerce
    .number({ error: "Invalid cheque ID" })
    .int("Invalid cheque ID")
    .positive("Invalid cheque ID"),
});

export const chequeExportFilterSchema = z.object({
  q: z
    .string()
    .nullish()
    .transform((val) => val?.trim() || ""),
  status: z
    .string()
    .nullish()
    .transform((val) => (val ? val.toUpperCase() : "ALL")),
});

export type CreateChequeInput = z.infer<typeof createChequeSchema>;
export type UpdateChequeInput = z.infer<typeof updateChequeSchema>;
export type UpdateChequeStatusInput = z.infer<typeof updateChequeStatusSchema>;
