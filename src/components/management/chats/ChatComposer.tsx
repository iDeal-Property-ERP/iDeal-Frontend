'use client';

import { ImagePlus, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { validateChatImage, validateChatText } from '@/components/management/chats/chatUtils';
import type {
  ChatImageValidationError,
  ChatTextValidationError,
} from '@/components/management/chats/chatUtils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ComposerError =
  | ChatTextValidationError
  | ChatImageValidationError
  | 'send_failed'
  | 'image_send_failed';

function errorKey(
  error: ComposerError,
):
  | 'text_empty'
  | 'text_too_long'
  | 'image_too_large'
  | 'image_type_invalid'
  | 'send_failed'
  | 'image_send_failed' {
  switch (error) {
    case 'empty': {
      return 'text_empty';
    }
    case 'too_long': {
      return 'text_too_long';
    }
    case 'too_large': {
      return 'image_too_large';
    }
    case 'unsupported_type': {
      return 'image_type_invalid';
    }
    case 'image_send_failed': {
      return 'image_send_failed';
    }
    default: {
      return 'send_failed';
    }
  }
}

/**
 * Renders the staff reply composer with text and validated image sending.
 * @param props - Disabled state and optimistic-send callbacks.
 * @returns The message composer.
 */
export function ChatComposer(props: {
  disabled: boolean;
  sending: boolean;
  onSendText: (text: string, clientId: string) => Promise<void>;
  onSendImage: (image: File, clientId: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}) {
  const t = useTranslations('ChatsPage');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<ComposerError | null>(null);
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTypingRef = useRef(props.onTyping);

  onTypingRef.current = props.onTyping;

  const setTyping = (isTyping: boolean) => {
    if (typingRef.current === isTyping) {
      return;
    }
    typingRef.current = isTyping;
    onTypingRef.current(isTyping);
  };

  useEffect(
    () => () => {
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
      }
      if (typingRef.current) {
        typingRef.current = false;
        onTypingRef.current(false);
      }
    },
    [],
  );

  const submitText = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (props.disabled) {
      return;
    }
    const value = text.trim();
    const validationError = validateChatText(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setText('');
    setTyping(false);
    try {
      await props.onSendText(value, crypto.randomUUID());
    } catch {
      setText(value);
      setError('send_failed');
    }
  };

  const selectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image || props.disabled) {
      return;
    }
    const validationError = validateChatImage(image);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await props.onSendImage(image, crypto.randomUUID());
    } catch {
      setError('image_send_failed');
    }
  };

  return (
    <form className="border-t border-border bg-card p-3" onSubmit={submitText}>
      <div className="flex items-end gap-2">
        <Textarea
          aria-label={t('composer_aria')}
          className="max-h-32 min-h-11 resize-none rounded-[12px] border-border bg-background py-3 text-sm"
          disabled={props.disabled}
          maxLength={1024}
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            setError(null);
            setTyping(nextText.trim().length > 0);
            if (typingTimerRef.current !== null) {
              clearTimeout(typingTimerRef.current);
            }
            if (nextText.trim().length > 0) {
              typingTimerRef.current = setTimeout(() => setTyping(false), 4000);
            }
          }}
          placeholder={t('composer_placeholder')}
          rows={1}
          value={text}
        />
        <input
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
          aria-label={t('attach_image')}
          className="hidden"
          disabled={props.disabled}
          onChange={selectImage}
          ref={fileInputRef}
          type="file"
        />
        <Button
          aria-label={t('attach_image')}
          className="size-11 rounded-[12px]"
          disabled={props.disabled || props.sending}
          onClick={() => fileInputRef.current?.click()}
          size="icon-lg"
          type="button"
          variant="outline"
        >
          <ImagePlus className="size-[18px]" />
        </Button>
        <Button
          aria-label={props.sending ? t('sending') : t('send')}
          className="size-11 rounded-[12px]"
          disabled={props.disabled || text.trim().length === 0}
          size="icon-lg"
          type="submit"
        >
          <Send className="size-[18px]" />
        </Button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
        <p aria-live="polite" className="min-h-4 text-xs text-danger">
          {error ? t(errorKey(error)) : ''}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {t('character_count', { count: text.length })}
        </span>
      </div>
    </form>
  );
}
