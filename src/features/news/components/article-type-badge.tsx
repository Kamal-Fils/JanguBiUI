import { Pill } from '@/components/ui/pill';

import { ContentType } from '../types';

type Tone = 'primary' | 'gold' | 'muted';

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; tone: Tone }> = {
  announcement: { label: 'Annonce', tone: 'primary' },
  article: { label: 'Article', tone: 'muted' },
  pastoral_letter: { label: 'Lettre Pastorale', tone: 'gold' },
};

interface ArticleTypeBadgeProps {
  contentType: ContentType | string | undefined;
  className?: string;
}

export function ArticleTypeBadge({
  contentType,
  className,
}: ArticleTypeBadgeProps) {
  const config =
    contentType && contentType in CONTENT_TYPE_CONFIG
      ? CONTENT_TYPE_CONFIG[contentType as ContentType]
      : { label: contentType ?? 'Article', tone: 'muted' as Tone };

  return (
    <Pill tone={config.tone} className={className}>
      {config.label}
    </Pill>
  );
}
