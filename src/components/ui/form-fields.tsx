'use client';

import type { ReactNode } from 'react';
import type { Control, ControllerRenderProps, FieldPath, FieldValues } from 'react-hook-form';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type BaseFieldProps<TForm extends FieldValues, TTransformed = TForm> = {
  control: Control<TForm, unknown, TTransformed>;
  name: FieldPath<TForm>;
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
};

// Text/number input field wired to react-hook-form + shadcn Form a11y.
function TextField<TForm extends FieldValues, TTransformed = TForm>(
  props: BaseFieldProps<TForm, TTransformed> & {
    type?: string;
    placeholder?: string;
    step?: string;
    inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel';
    autoComplete?: string;
  },
) {
  const { control, name, label, description, required, className, ...inputProps } = props;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} value={field.value ?? ''} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Multiline text field.
function TextareaField<TForm extends FieldValues, TTransformed = TForm>(
  props: BaseFieldProps<TForm, TTransformed> & { placeholder?: string; rows?: number },
) {
  const { control, name, label, description, required, className, ...textareaProps } = props;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <Textarea {...textareaProps} {...field} value={field.value ?? ''} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Rich (Radix) select field over a static option list.
function SelectField<TForm extends FieldValues, TTransformed = TForm>(
  props: BaseFieldProps<TForm, TTransformed> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  },
) {
  const { control, name, label, description, required, className, options, placeholder } = props;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? 'Select…'} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Date field backed by the dependency-free DatePicker (emits `YYYY-MM-DD`).
function DateField<TForm extends FieldValues, TTransformed = TForm>(
  props: BaseFieldProps<TForm, TTransformed> & { placeholder?: string },
) {
  const { control, name, label, description, required, className, placeholder } = props;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          <FormControl>
            <DatePicker
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={placeholder}
              aria-invalid={!!fieldState.error}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Generic wrapper for custom controls (e.g. entity comboboxes). The render prop
// receives the react-hook-form field so the control stays fully controlled.
function EntityField<TForm extends FieldValues, TTransformed = TForm>(
  props: BaseFieldProps<TForm, TTransformed> & {
    children: (
      field: ControllerRenderProps<TForm, FieldPath<TForm>>,
      invalid: boolean,
    ) => ReactNode;
  },
) {
  const { control, name, label, description, required, className, children } = props;
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel required={required}>{label}</FormLabel>
          {children(field, !!fieldState.error)}
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { DateField, EntityField, SelectField, TextareaField, TextField };
