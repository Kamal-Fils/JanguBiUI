import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
  date_joined: z.string().nullable().optional(),
  user_profile: z
    .object({
      first_name: z.string(),
      last_name: z.string(),
    })
    .nullable()
    .optional(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

const responseSchema = z.object({
  count: z.number(),
  results: z.array(adminUserSchema),
});

export type AdminUsersResponse = z.infer<typeof responseSchema>;

export type AdminUsersFilters = {
  role?: string;
  limit?: number;
  offset?: number;
};

export const getAdminUsers = (
  filters: AdminUsersFilters = {},
): Promise<AdminUsersResponse> => {
  const params: Record<string, string | number> = {};
  if (filters.role) params.role = filters.role;
  if (filters.limit !== undefined) params.limit = filters.limit;
  if (filters.offset !== undefined) params.offset = filters.offset;

  return api
    .get<unknown>('/v1/users/', {
      params: Object.keys(params).length ? params : undefined,
    })
    .then((data) => responseSchema.parse(data));
};

export const getAdminUsersQueryOptions = (filters: AdminUsersFilters = {}) =>
  queryOptions({
    queryKey: ['admin-users', filters],
    queryFn: () => getAdminUsers(filters),
  });

export const useAdminUsers = (filters: AdminUsersFilters = {}) =>
  useQuery(getAdminUsersQueryOptions(filters));
