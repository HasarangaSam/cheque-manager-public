"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ChequeStatus } from "@/lib/cheque-status";
import { requireAuth } from "@/lib/auth";
import {
  createChequeSchema,
  updateChequeSchema,
  updateChequeStatusSchema,
  deleteChequeSchema,
  formatZodError,
} from "@/lib/validations";
import type { ActionResponse } from "@/types/actions";

export type { ActionResponse };

export async function createCheque(
  _prevState: ActionResponse<{ id: number; customerId: number }> | null,
  formData: FormData
): Promise<ActionResponse<{ id: number; customerId: number }>> {
  try {
    await requireAuth();

    const parseResult = createChequeSchema.safeParse({
      customerId: formData.get("customerId"),
      chequeNumber: formData.get("chequeNumber"),
      bank: formData.get("bank"),
      amount: formData.get("amount"),
      dueDate: formData.get("dueDate"),
      notes: formData.get("notes"),
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const { customerId, chequeNumber, bank, amount, dueDate, notes } =
      parseResult.data;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    const cheque = await prisma.cheque.create({
      data: {
        customerId,
        chequeNumber,
        bank,
        amount,
        dueDate,
        status: "PENDING",
        notes,
      },
    });

    revalidatePath("/");
    revalidatePath("/cheques");
    revalidatePath(`/customers/${customerId}`);

    return {
      success: true,
      message: `Cheque "${cheque.chequeNumber}" created successfully!`,
      data: { id: cheque.id, customerId },
    };
  } catch (error) {
    console.error("Failed to create cheque:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create cheque",
    };
  }
}

export async function updateCheque(
  _prevState: ActionResponse<{ id: number; customerId: number }> | null,
  formData: FormData
): Promise<ActionResponse<{ id: number; customerId: number }>> {
  try {
    await requireAuth();

    const parseResult = updateChequeSchema.safeParse({
      id: formData.get("id"),
      chequeNumber: formData.get("chequeNumber"),
      bank: formData.get("bank"),
      amount: formData.get("amount"),
      dueDate: formData.get("dueDate"),
      status: formData.get("status"),
      notes: formData.get("notes"),
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const { id, chequeNumber, bank, amount, dueDate, status, notes } =
      parseResult.data;

    const existingCheque = await prisma.cheque.findUnique({
      where: {
        id,
      },
      select: {
        customerId: true,
      },
    });

    if (!existingCheque) {
      return { success: false, error: "Cheque not found" };
    }

    const updatedCheque = await prisma.cheque.update({
      where: {
        id,
      },
      data: {
        chequeNumber,
        bank,
        amount,
        dueDate,
        status,
        notes,
      },
    });

    revalidatePath("/");
    revalidatePath("/cheques");
    revalidatePath(`/cheques/${id}`);
    revalidatePath(`/customers/${existingCheque.customerId}`);

    return {
      success: true,
      message: `Cheque "${updatedCheque.chequeNumber}" updated successfully!`,
      data: { id: updatedCheque.id, customerId: existingCheque.customerId },
    };
  } catch (error) {
    console.error("Failed to update cheque:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update cheque",
    };
  }
}

export async function updateChequeStatus(
  id: number,
  newStatus: ChequeStatus
): Promise<ActionResponse> {
  try {
    await requireAuth();

    const parseResult = updateChequeStatusSchema.safeParse({
      id,
      status: newStatus,
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const { id: validId, status: validStatus } = parseResult.data;

    const existing = await prisma.cheque.findUnique({
      where: { id: validId },
      select: { customerId: true, chequeNumber: true },
    });

    if (!existing) {
      return { success: false, error: "Cheque not found" };
    }

    await prisma.cheque.update({
      where: { id: validId },
      data: { status: validStatus },
    });

    revalidatePath("/");
    revalidatePath("/cheques");
    revalidatePath(`/cheques/${validId}`);
    revalidatePath(`/customers/${existing.customerId}`);

    return {
      success: true,
      message: `Status of "${existing.chequeNumber}" changed to ${validStatus}`,
    };
  } catch (error) {
    console.error("Failed to update cheque status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update cheque status",
    };
  }
}

export async function deleteCheque(
  id: number
): Promise<ActionResponse<{ customerId: number }>> {
  try {
    await requireAuth();

    const parseResult = deleteChequeSchema.safeParse({ id });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const validId = parseResult.data.id;

    const cheque = await prisma.cheque.findUnique({
      where: {
        id: validId,
      },
      select: {
        customerId: true,
        chequeNumber: true,
      },
    });

    if (!cheque) {
      return { success: false, error: "Cheque not found" };
    }

    await prisma.cheque.delete({
      where: {
        id: validId,
      },
    });

    revalidatePath("/");
    revalidatePath("/cheques");
    revalidatePath(`/customers/${cheque.customerId}`);

    return {
      success: true,
      message: `Cheque "${cheque.chequeNumber}" has been deleted.`,
      data: { customerId: cheque.customerId },
    };
  } catch (error) {
    console.error("Failed to delete cheque:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete cheque",
    };
  }
}

