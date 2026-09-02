'use client';

import DOMPurify from 'dompurify';
import { AlignLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo } from 'react';

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'h3', 'ul', 'ol', 'li'];

function domToReact(node: Node, key: string | number): React.ReactNode {
  if (node.nodeType === 3) {
    // TEXT_NODE
    return node.textContent;
  }
  if (node.nodeType !== 1) {
    // Not an ELEMENT_NODE
    return null;
  }

  // SAFETY: nodeType === 1 guarantees node is an HTMLElement
  const el = node as HTMLElement;
  const tagName = el.tagName.toLowerCase();
  const children = [...el.childNodes].map(
    (child: Node, index: number): React.ReactNode => domToReact(child, `${key}-${index}`),
  );

  switch (tagName) {
    case 'p': {
      return <p key={key}>{children}</p>;
    }
    case 'h3': {
      return <h3 key={key}>{children}</h3>;
    }
    case 'strong': {
      return <strong key={key}>{children}</strong>;
    }
    case 'em': {
      return <em key={key}>{children}</em>;
    }
    case 'br': {
      return <br key={key} />;
    }
    case 'ul': {
      return <ul key={key}>{children}</ul>;
    }
    case 'ol': {
      return <ol key={key}>{children}</ol>;
    }
    case 'li': {
      return <li key={key}>{children}</li>;
    }
    default: {
      return <React.Fragment key={key}>{children}</React.Fragment>;
    }
  }
}

/**
 * "About this home" section — permanently expanded semantic card rendering
 * sanitized rich HTML listing description.
 * @param props - The listing description HTML string.
 * @returns The elevated detail card.
 */
export function ListingAbout(props: { text: string }) {
  const t = useTranslations('ListingDetail');

  const content = useMemo((): React.ReactNode => {
    if (!globalThis.window) {
      return <p>{props.text}</p>;
    }
    const cleanHtml = DOMPurify.sanitize(props.text, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: [],
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    return [...doc.body.childNodes].map(
      (node: ChildNode, index: number): React.ReactNode => domToReact(node, index),
    );
  }, [props.text]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs md:p-6">
      <div className="flex items-center gap-2.5">
        <AlignLeft className="size-5 text-accent-brand" />
        <h2 className="text-[18px] font-semibold text-foreground max-md:text-[16px]">
          {t('about')}
        </h2>
      </div>
      <div className="mt-3.5 text-sm leading-relaxed text-muted-foreground [&_em]:italic [&_h3]:mt-3.5 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mb-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
        {content}
      </div>
    </div>
  );
}
