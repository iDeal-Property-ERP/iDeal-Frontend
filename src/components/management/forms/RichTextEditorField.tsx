'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Bold, Heading3, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';
import { useEffect } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/libs/utils';

type RichTextEditorFieldProps<TForm extends FieldValues, TTransformed = TForm> = {
  control: Control<TForm, unknown, TTransformed>;
  name: FieldPath<TForm>;
  label: string;
  description?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

type RichTextEditorInnerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function RichTextEditorInner(props: RichTextEditorInnerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3],
        },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
    ],
    content: props.value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.isEmpty ? '' : currentEditor.getHTML();
      props.onChange(html);
    },
  });

  // Keep TipTap content in sync when value changes externally (e.g. locale switch or reset)
  useEffect(() => {
    if (editor) {
      const currentHTML = editor.isEmpty ? '' : editor.getHTML();
      if (currentHTML !== props.value) {
        editor.commands.setContent(props.value);
      }
    }
  }, [editor, props.value]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background focus-within:border-transparent focus-within:ring-2 focus-within:ring-ring">
      {/* Compact Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={!editor}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            editor?.isActive('heading', { level: 3 }) &&
              'bg-muted font-bold text-foreground shadow-xs',
          )}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <Heading3 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            editor?.isActive('bold') && 'bg-muted font-bold text-foreground shadow-xs',
          )}
          title="Bold"
          aria-label="Bold"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            editor?.isActive('italic') && 'bg-muted font-bold text-foreground shadow-xs',
          )}
          title="Italic"
          aria-label="Italic"
        >
          <Italic className="size-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            editor?.isActive('bulletList') && 'bg-muted font-bold text-foreground shadow-xs',
          )}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            editor?.isActive('orderedList') && 'bg-muted font-bold text-foreground shadow-xs',
          )}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered className="size-4" />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor || !editor.can().undo()}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          title="Undo"
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor || !editor.can().redo()}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          title="Redo"
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className="min-h-[120px] p-3 text-sm text-foreground focus:outline-none [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ol]:my-1.5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0 [&_.ProseMirror_ul]:my-1.5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5"
      />
    </div>
  );
}

/**
 * Locale-aware rich text editor field using TipTap with a compact toolbar.
 * @param props - Form control, field name, label, and description props.
 * @returns The rich text editor component.
 */
export function RichTextEditorField<TForm extends FieldValues, TTransformed = TForm>(
  props: RichTextEditorFieldProps<TForm, TTransformed>,
) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className={props.className}>
          <FormLabel required={props.required}>{props.label}</FormLabel>
          <FormControl>
            <RichTextEditorInner
              // SAFETY: field.value is bound to form string schema
              value={(field.value as string | undefined) ?? ''}
              onChange={field.onChange}
              placeholder={props.placeholder}
            />
          </FormControl>
          {props.description ? <FormDescription>{props.description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
