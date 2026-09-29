"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  createCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  customerSelectionSchema,
  formatZodError,
} from "@/lib/validations";
import type { ActionResponse } from "@/types/actions";

export type { ActionResponse };

export async function createCustomer(
  _prevState: ActionResponse<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResponse<{ id: number }>> {
  try {
    await requireAuth();

    const parseResult = createCustomerSchema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      notes: formData.get("notes"),
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const { name, phone, address, notes } = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        notes,
      },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath("/cheques/new");

    return {
      success: true,
      message: `Customer "${customer.name}" created successfully!`,
      data: { id: customer.id },
    };
  } catch (error) {
    console.error("Failed to create customer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create customer",
    };
  }
}

export async function updateCustomer(
  _prevState: ActionResponse<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResponse<{ id: number }>> {
  try {
    await requireAuth();

    const parseResult = updateCustomerSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      notes: formData.get("notes"),
    });

    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const { id, name, phone, address, notes } = parseResult.data;

    const customer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name,
        phone,
        address,
        notes,
      },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/cheques");
    revalidatePath("/cheques/new");

    return {
      success: true,
      message: `Customer "${customer.name}" updated successfully!`,
      data: { id: customer.id },
    };
  } catch (error) {
    console.error("Failed to update customer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update customer",
    };
  }
}

export async function deleteCustomer(id: number): Promise<ActionResponse> {
  try {
    await requireAuth();

    const parseResult = deleteCustomerSchema.safeParse({ id });
    if (!parseResult.success) {
      return {
        success: false,
        error: formatZodError(parseResult.error),
      };
    }

    const validId = parseResult.data.id;

    const customer = await prisma.customer.delete({
      where: {
        id: validId,
      },
    });

    revalidatePath("/");
    revalidatePath("/customers");
    revalidatePath("/cheques");
    revalidatePath("/cheques/new");

    return {
      success: true,
      message: `Customer "${customer.name}" and all associated cheques have been deleted.`,
    };
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete customer",
    };
  }
}

export async function getCustomersForSelection(
  query?: string,
  limit: number = 10,
): Promise<Array<{ id: number; name: string; phone: string }>> {
  await requireAuth();

  try {
    const parseResult = customerSelectionSchema.safeParse({ query, limit });
    const { query: validatedQuery, limit: validatedLimit } = parseResult.success
      ? parseResult.data
      : { query: "", limit: 10 };

    const term = validatedQuery.trim();
    const customers = await prisma.customer.findMany({
      where: term
        ? {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { phone: { contains: term } },
            ],
          }
        : undefined,
      take: validatedLimit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });
    return customers;
  } catch (error) {
    console.error("Failed to fetch customers for selection:", error);
    return [];
  }
}
