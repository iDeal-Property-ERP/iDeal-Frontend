type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

/**
 * Form field wrapper with label, required indicator, and error message.
 * @param props - Label text, required flag, error string, and child input.
 * @returns Labeled form field container.
 */
export function FormField(props: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {props.label}
        {props.required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {props.children}
      {props.error ? <p className="text-xs text-danger">{props.error}</p> : null}
    </div>
  );
}
