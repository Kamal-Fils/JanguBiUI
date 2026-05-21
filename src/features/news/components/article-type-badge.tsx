import { Badge } from '@/components/ui/badge/badge';
import { cn } from '@/utils/cn';

import { ContentType } from '../types';

const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { label: string; className: string }
> = {
  announcement: {
    label: 'Annonce',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  article: {
    label: 'Article',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  pastoral_letter: {
    label: 'Lettre Pastorale',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
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
      : { label: contentType ?? 'Article', className: '' };

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
