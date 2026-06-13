type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormField(props: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700 dark:text-zinc-300">
        {props.label}
        {props.required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      {props.children}
      {props.error ? <p className="text-xs text-red-500">{props.error}</p> : null}
    </div>
  );
}
