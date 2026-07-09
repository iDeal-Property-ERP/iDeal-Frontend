'use client';

import { SendHorizonal } from 'lucide-react';
import { useState } from 'react';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';

export type ThreadComment = {
  id: number;
  author_name: string | null;
  body: string;
  created_at: string;
};

/**
 * A comment thread for the maintenance record panel — a list of authored notes
 * (avatar + name + relative time + body) above a composer. The composer is
 * controlled locally and calls `onSubmit` on send; the parent owns persistence
 * and refetch.
 * @param props - The comments, the submit handler, and localized labels.
 * @returns The comment thread element.
 */
export function CommentThread(props: {
  comments: ThreadComment[];
  onSubmit: (body: string) => void | Promise<void>;
  isLoading?: boolean;
  labels: {
    placeholder: string;
    post: string;
    empty: string;
    relativeTime: (iso: string) => string;
  };
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const body = value.trim();
    if (!body || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await props.onSubmit(body);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {props.comments.length === 0 && !props.isLoading ? (
        <p className="text-sm text-muted-foreground">{props.labels.empty}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {props.comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <AvatarInitials name={comment.author_name ?? '?'} size={32} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.author_name ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {props.labels.relativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-5 text-foreground">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-[10px] border border-input bg-background px-3.5 py-2.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={props.labels.placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!value.trim() || submitting}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-brand disabled:text-muted-foreground"
        >
          <SendHorizonal className="size-4" />
          {props.labels.post}
        </button>
      </div>
    </div>
  );
}
