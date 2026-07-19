import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import { Article, articleSchema } from '../types';

/**
 * Corps dérivé du schéma OpenAPI plutôt que recopié à la main.
 *
 * La liste écrite à la main avait déjà divergé : elle omettait `scope_church_id`
 * et bornait `scope_type` à trois valeurs, alors que le serveur en accepte
 * quatre depuis le chantier hiérarchie. Résultat, la portée « église » existait
 * de bout en bout côté serveur et restait inatteignable — sans la moindre
 * erreur, puisque rien ne comparait les deux définitions.
 *
 * `Partial` sur les champs à valeur par défaut (le serveur les remplit), mais
 * la dérivation conserve les NOMS : un champ mal orthographié ou disparu du
 * contrat devient une erreur de compilation.
 */
type ArticleCreateBody = RequestBody<'v1_news_admin_create_create'>;

export type CreateArticleInput = Partial<ArticleCreateBody> &
  Pick<ArticleCreateBody, 'title' | 'content' | 'category_id'>;

export const createArticle = (data: CreateArticleInput): Promise<Article> =>
  api
    .post<unknown>('/v1/news/admin/create/', data)
    .then((res) => articleSchema.parse(res));

export const useCreateArticle = ({
  onSuccess,
}: { onSuccess?: (article: Article) => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: (article) => {
      queryClient.invalidateQueries({ queryKey: ['articles', 'admin'] });
      onSuccess?.(article);
    },
  });
};
