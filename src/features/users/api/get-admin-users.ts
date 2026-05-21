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

export const getAdminUsers = (
  role?: string,
): Promise<z.infer<typeof responseSchema>> =>
  api
    .get<unknown>('/v1/users/', { params: role ? { role } : undefined })
    .then((data) => responseSchema.parse(data));

export const getAdminUsersQueryOptions = (role?: string) =>
  queryOptions({
    queryKey: ['admin-users', role ?? null],
    queryFn: () => getAdminUsers(role),
  });

export const useAdminUsers = (role?: string) =>
  useQuery(getAdminUsersQueryOptions(role));
