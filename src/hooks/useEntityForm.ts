'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { ZodType } from 'zod';
import { apiFetch } from '@/libs/api';
import { getApiErrorMessage } from '@/libs/forms';

type UseEntityFormConfig<TData, TForm extends FieldValues> = {
  /** API path of the single record to load (e.g. `/properties/12/`). */
  path: string;
  /** Zod schema validating the form values. */
  schema: ZodType<TForm>;
  /** Maps the loaded record into react-hook-form reset values. */
  toFormValues: (data: TData) => TForm;
  /** Toast message shown when the record fails to load. */
  errorMessage?: string;
};

type UseEntityFormResult<TData, TForm extends FieldValues> = {
  form: UseFormReturn<TForm>;
  loading: boolean;
  data: TData | null;
};

/**
 * Loads a single record and seeds a react-hook-form instance with it, providing
 * a uniform load → reset → loading lifecycle for edit pages.
 * @param config - Path, schema, value mapper, and optional error message.
 * @returns The form instance, loading flag, and the loaded record.
 */
export function useEntityForm<TData, TForm extends FieldValues>(
  config: UseEntityFormConfig<TData, TForm>,
): UseEntityFormResult<TData, TForm> {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TData | null>(null);

  // SAFETY: ZodType is widened for zodResolver generic compatibility
  const form = useForm<TForm, unknown, TForm>({
    resolver: zodResolver(config.schema as never),
  });

  useEffect(() => {
    const run = async () => {
      try {
        const record = await apiFetch<TData>(config.path);
        setData(record);
        form.reset(config.toFormValues(record));
      } catch (error) {
        toast.error(getApiErrorMessage(error, config.errorMessage ?? 'Failed to load'));
      } finally {
        setLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.path]);

  return { form, loading, data };
}
