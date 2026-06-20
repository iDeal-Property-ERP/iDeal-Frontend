import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError_ } from '@/libs/api';

/**
 * Extracts a human-readable message from an unknown thrown value, preferring
 * the API error envelope's message.
 * @param error - The thrown value.
 * @param fallback - Message to use when nothing better can be derived.
 * @returns A display message.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError_) {
    return error.body?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Best-effort mapping of server-side field errors onto a react-hook-form
 * instance. Backends that return `error` as a `{ field: message }` object get
 * their messages attached to the matching fields; otherwise a toast is shown.
 * @param error - The thrown value (usually an {@link ApiError_}).
 * @param form - The react-hook-form instance to attach errors to.
 * @param fallback - Toast message used when no field mapping applies.
 */
export function applyApiError<TForm extends FieldValues>(
  error: unknown,
  form: UseFormReturn<TForm>,
  fallback: string,
): void {
  if (error instanceof ApiError_) {
    const raw: unknown = error.body?.error;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      let mappedAny = false;
      const fields = form.getValues();
      for (const [key, message] of Object.entries(raw as Record<string, unknown>)) {
        if (key in fields) {
          form.setError(key as Path<TForm>, {
            type: 'server',
            message: Array.isArray(message) ? String(message[0]) : String(message),
          });
          mappedAny = true;
        }
      }
      if (mappedAny) {
        toast.error(getApiErrorMessage(error, fallback));
        return;
      }
    }
  }
  toast.error(getApiErrorMessage(error, fallback));
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
