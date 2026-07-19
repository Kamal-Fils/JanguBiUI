import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import { useNotifications } from '@/components/ui/notifications';
import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

import {
  articleReactionsSchema,
  EMPTY_REACTIONS,
  type Article,
  type ArticleReactions,
  type ReactionType,
} from '../types';

/**
 * Corps de requête attendu par `POST /v1/news/{id}/reactions/`, **dérivé du
 * contrat serveur** : un champ mal nommé ou disparu du schéma devient une
 * erreur de compilation, au lieu d'un appel qui échoue en silence à l'exécution.
 */
type SetReactionBody = RequestBody<'v1_news_reactions_create'>;

export type SetArticleReactionInput = {
  articleId: string;
  reactionType: ReactionType;
  /** État VOULU, pas une bascule : rejouer la requête est sans effet. */
  active: boolean;
};

/**
 * Toutes les requêtes d'articles (fil, global, paroisse, diocèse, détail) sont
 * indexées sous `['articles', …]` — une seule racine à patcher.
 */
const ARTICLES_QUERY_KEY = ['articles'] as const;

export const setArticleReaction = ({
  articleId,
  reactionType,
  active,
}: SetArticleReactionInput): Promise<ArticleReactions> =>
  api
    .post<unknown>(`/v1/news/${articleId}/reactions/`, {
      reaction_type: reactionType,
      active,
    } satisfies SetReactionBody)
    .then((data) => articleReactionsSchema.parse(data));

/** Calcule l'état optimiste. No-op si la réaction est déjà dans l'état voulu. */
function nextReactions(
  current: ArticleReactions | undefined,
  reactionType: ReactionType,
  active: boolean,
): ArticleReactions {
  const base = current ?? EMPTY_REACTIONS;
  if (base.mine.includes(reactionType) === active) return base;

  return {
    counts: {
      ...base.counts,
      [reactionType]: Math.max(
        0,
        base.counts[reactionType] + (active ? 1 : -1),
      ),
    },
    mine: active
      ? [...base.mine, reactionType]
      : base.mine.filter((type) => type !== reactionType),
  };
}

/**
 * Applique `transform` à l'article ciblé, quelle que soit la forme du cache :
 * page paginée (`{ count, results }`) ou détail (l'article seul).
 *
 * Retourne la référence d'origine quand rien ne change — sans ça, chaque clic
 * ferait re-rendre toutes les listes en cache, y compris celles qui ne
 * contiennent pas l'article.
 */
function patchArticleInCache(
  data: unknown,
  articleId: string,
  transform: (current: ArticleReactions | undefined) => ArticleReactions,
): unknown {
  if (!data || typeof data !== 'object') return data;

  if (
    'results' in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    const page = data as { count: number; results: Article[] };
    let touched = false;
    const results = page.results.map((article) => {
      if (article.id !== articleId) return article;
      touched = true;
      return { ...article, reactions: transform(article.reactions) };
    });
    return touched ? { ...page, results } : page;
  }

  const article = data as Partial<Article>;
  if (article.id === articleId) {
    return { ...article, reactions: transform(article.reactions) };
  }

  return data;
}

/**
 * Pose ou retire une réaction, avec mise à jour optimiste et **retour arrière
 * visible** en cas d'échec.
 *
 * Le retour arrière silencieux est le vrai risque ici : ce projet a déjà connu
 * des actions qui semblaient enregistrées et ne l'étaient pas. On restaure donc
 * l'état précédent ET on affiche un message — l'utilisateur doit savoir que son
 * geste n'a pas été pris en compte.
 *
 * Pas d'invalidation globale au succès : la réponse du serveur contient déjà
 * l'état réconcilié de l'article touché, et re-télécharger tout un fil de 20
 * articles à chaque clic coûterait cher pour rien.
 */
export const useSetArticleReaction = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation({
    mutationFn: setArticleReaction,

    onMutate: async ({ articleId, reactionType, active }) => {
      // Une requête en vol qui reviendrait après le patch écraserait l'optimisme.
      await queryClient.cancelQueries({ queryKey: ARTICLES_QUERY_KEY });

      const snapshot = queryClient.getQueriesData({
        queryKey: ARTICLES_QUERY_KEY,
      });

      queryClient.setQueriesData({ queryKey: ARTICLES_QUERY_KEY }, (data) =>
        patchArticleInCache(data, articleId, (current) =>
          nextReactions(current, reactionType, active),
        ),
      );

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      (context?.snapshot ?? []).forEach(
        ([queryKey, data]: [QueryKey, unknown]) => {
          queryClient.setQueryData(queryKey, data);
        },
      );

      addNotification({
        type: 'error',
        title: 'Réaction non enregistrée',
        message:
          "Votre réaction n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.",
      });
    },

    onSuccess: (serverReactions, { articleId }) => {
      // Vérité serveur : elle intègre aussi les réactions des autres fidèles
      // arrivées entre-temps, que l'optimisme local ne pouvait pas connaître.
      queryClient.setQueriesData({ queryKey: ARTICLES_QUERY_KEY }, (data) =>
        patchArticleInCache(data, articleId, () => serverReactions),
      );
    },
  });
};
