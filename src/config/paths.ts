export const paths = {
  home: {
    getHref: () => '/app',
  },

  onboarding: {
    getHref: () => '/onboarding',
  },

  auth: {
    register: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    login: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    forgotPassword: {
      getHref: () => '/auth/forgot-password',
    },
    resetPassword: {
      getHref: (token?: string) =>
        token
          ? `/auth/reset-password?token=${encodeURIComponent(token)}`
          : '/auth/reset-password',
    },
    verifyEmail: {
      getHref: (token?: string) =>
        token
          ? `/auth/verify-email?token=${encodeURIComponent(token)}`
          : '/auth/verify-email',
    },
  },

  app: {
    root: { getHref: () => '/app' },
    actus: { getHref: () => '/app/actus' },
    article: { getHref: (id: string) => `/app/actus/${id}` },
    spirituel: { getHref: () => '/app/spirituel' },
    spirituelLiturgie: { getHref: () => '/app/spirituel/liturgie' },
    spirituelHeures: { getHref: () => '/app/spirituel/heures' },
    bible: { getHref: () => '/app/bible' },
    chapelet: { getHref: () => '/app/chapelet' },
    tv: { getHref: () => '/app/tv' },
    messages: { getHref: () => '/app/messages' },
    conversation: { getHref: (id: string) => `/app/messages/${id}` },
    documents: { getHref: () => '/app/documents' },
    newDocument: { getHref: () => '/app/documents/new' },
    document: { getHref: (id: string) => `/app/documents/${id}` },
    profil: { getHref: () => '/app/profil' },
    admin: {
      root: { getHref: () => '/app/admin' },
      availability: { getHref: () => '/app/admin/availability' },
      articles: { getHref: () => '/app/admin/articles' },
      articleNew: { getHref: () => '/app/admin/articles/new' },
      articleEdit: {
        getHref: (id: string) => `/app/admin/articles/${id}/edit`,
      },
      documents: { getHref: () => '/app/admin/documents' },
      tv: { getHref: () => '/app/admin/tv' },
      org: { getHref: () => '/app/admin/org' },
      users: {
        list: { getHref: () => '/app/admin/users' },
        invitations: { getHref: () => '/app/admin/users/invitations' },
        invite: { getHref: () => '/app/admin/users/invite' },
      },
    },
  },

  acceptInvitation: {
    getHref: (token?: string) =>
      token
        ? `/accept-invitation?token=${encodeURIComponent(token)}`
        : '/accept-invitation',
  },
} as const;
