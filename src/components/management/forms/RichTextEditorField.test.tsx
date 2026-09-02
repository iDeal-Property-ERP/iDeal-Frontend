import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Form } from '@/components/ui/form';
import { RichTextEditorField } from './RichTextEditorField';

type FormValues = {
  description: string;
};

function TestEditorForm(props: { defaultValue?: string }) {
  const form = useForm<FormValues>({
    defaultValues: {
      description: props.defaultValue ?? '<p>Initial description text</p>',
    },
  });

  return (
    <Form {...form}>
      <form>
        <RichTextEditorField
          control={form.control}
          name="description"
          label="Property Description"
          description="Hint description in English"
        />
      </form>
    </Form>
  );
}

describe(RichTextEditorField, () => {
  it('renders label, hint, and initial editor content', async () => {
    const screen = await render(<TestEditorForm />);

    await expect.element(screen.getByText('Property Description', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Hint description in English')).toBeVisible();
    await expect.element(screen.getByText('Initial description text')).toBeVisible();
  });

  it('renders formatting toolbar buttons', async () => {
    const screen = await render(<TestEditorForm />);

    expect(screen.getByRole('button', { name: 'Heading 3' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bullet List' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDefined();
  });
});
