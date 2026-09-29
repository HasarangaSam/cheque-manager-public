/**
 * Generic server action response type.
 * Used across all server actions for a consistent response shape.
 */
export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};
