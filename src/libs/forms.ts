import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ApiError_ } from '@/libs/api';

/**
 * Extracts a human-readable message from an unknown thrown value, preferring
 * the API error envelope's message.
 * @param cause - The thrown value.
 * @param fallback - Message to use when nothing better can be derived.
 * @returns A display message.
 */
/**
 * Generic backend envelope messages are hardcoded English strings. Prefer the
 * caller's localized `fallback` over these so the UI stays in the active locale;
 * a specific backend message (e.g. an invalid-transition reason) is kept.
 */
const GENERIC_BACKEND_MESSAGES = new Set([
  'Validation error',
  'Internal server error',
  'Not found',
  'Invalid request body',
  'Data conflict',
  'Cannot delete',
  'NOT OK',
]);

export function getApiErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof ApiError_) {
    const message = cause.body?.message;
    if (message && !GENERIC_BACKEND_MESSAGES.has(message)) {
      return message;
    }
    return fallback;
  }
  if (cause instanceof Error && cause.message) {
    return cause.message;
  }
  return fallback;
}

const LocArraySchema = z.array(z.union([z.string(), z.number()]));
const PydanticErrorItemSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])).optional(),
  msg: z.string().optional(),
});
const PydanticErrorListSchema = z.array(PydanticErrorItemSchema);
const FieldMessageMapSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

/**
 * Field name from a Pydantic error `loc` tuple, e.g. ["parsed_body","amount"] → "amount".
 * @param cause - The `loc` value from a Pydantic error item.
 * @returns The last string segment, or null if not derivable.
 */
function fieldFromLoc(cause: unknown): string | null {
  const parsed = LocArraySchema.safeParse(cause);
  if (parsed.success && parsed.data.length > 0) {
    const last = parsed.data.at(-1);
    return z.string().safeParse(last).data ?? null;
  }
  return null;
}

/**
 * Best-effort mapping of server-side field errors onto a react-hook-form
 * instance. Backends that return `error` as a `{ field: message }` object get
 * their messages attached to the matching fields; otherwise a toast is shown.
 * @param cause - The thrown value (usually an {@link ApiError_}).
 * @param form - The react-hook-form instance to attach errors to.
 * @param fallback - Toast message used when no field mapping applies.
 */
export function applyApiError<TForm extends FieldValues>(
  cause: unknown,
  form: UseFormReturn<TForm>,
  fallback: string,
): void {
  if (cause instanceof ApiError_) {
    const raw = cause.body?.error;
    const fields = form.getValues();
    let mappedAny = false;

    const listResult = PydanticErrorListSchema.safeParse(raw);
    if (listResult.success) {
      // Pydantic validation errors: [{ loc: [...], msg, type }, ...]
      for (const item of listResult.data) {
        const field = fieldFromLoc(item.loc);
        if (field && field in fields) {
          // SAFETY: Dynamic key verified to exist in form field set
          form.setError(field as Path<TForm>, { type: 'server', message: item.msg ?? '' });
          mappedAny = true;
        }
      }
    } else {
      const mapResult = FieldMessageMapSchema.safeParse(raw);
      if (mapResult.success) {
        // { field: message } shape.
        for (const [key, message] of Object.entries(mapResult.data)) {
          if (key in fields) {
            // SAFETY: Dynamic key verified to exist in form field set
            form.setError(key as Path<TForm>, {
              type: 'server',
              message: Array.isArray(message) ? (message[0] ?? '') : message,
            });
            mappedAny = true;
          }
        }
      }
    }

    if (mappedAny) {
      toast.error(getApiErrorMessage(cause, fallback));
      return;
    }
  }
  toast.error(getApiErrorMessage(cause, fallback));
}

type ApiSubmitConfig<TForm extends FieldValues, TResult> = {
  /** Performs the mutation. Receives validated form values. */
  submit: (values: TForm) => Promise<TResult>;
  /** Toast shown on success. */
  success: string;
  /** Toast shown on failure (also used as a fallback message). */
  error?: string;
  /** Runs after a successful submit (e.g. navigation, list refresh, form reset). */
  onSuccess?: (result: TResult) => void | Promise<void>;
};

/**
 * Wraps {@link UseFormReturn.handleSubmit} with standardized success/error
 * toasts and server-error mapping. `form.formState.isSubmitting` stays accurate
 * because the async work runs inside the handler.
 * @param form - The react-hook-form instance.
 * @param config - Submit action plus success/error handling.
 * @returns A submit handler to pass to `<form onSubmit={...}>`.
 */
export function createApiSubmit<TForm extends FieldValues, TResult>(
  form: UseFormReturn<TForm>,
  config: ApiSubmitConfig<TForm, TResult>,
) {
  const fallback = config.error ?? 'Something went wrong. Please try again.';
  return form.handleSubmit(async (values) => {
    try {
      const result = await config.submit(values);
      toast.success(config.success);
      await config.onSuccess?.(result);
    } catch (error) {
      applyApiError(error, form, fallback);
    }
  });
}
