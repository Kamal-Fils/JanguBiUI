'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import {
  FormProvider,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Parish } from '@/features/allo-pretre/api/mutations-parish';
import {
  useCreateParish,
  useUpdateParish,
} from '@/features/allo-pretre/api/mutations-parish';

const parishSchema = z.object({
  name: z.string().min(1, 'Requis'),
  address: z.string().optional(),
  city: z.string().min(1, 'Requis'),
  country: z.string().optional(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type ParishFormValues = z.infer<typeof parishSchema>;

interface ParishFormProps {
  parish: Parish | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ParishForm({ parish, onSuccess, onCancel }: ParishFormProps) {
  const createMutation = useCreateParish();
  const updateMutation = useUpdateParish();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ParishFormValues>({
    resolver: zodResolver(parishSchema),
    defaultValues: {
      name: parish?.name || '',
      address: parish?.address || '',
      city: parish?.city || '',
      country: parish?.country || 'Sénégal',
      latitude: parish?.latitude || '',
      longitude: parish?.longitude || '',
      is_active: parish?.is_active ?? true,
    },
  });

  const onSubmit = (values: ParishFormValues) => {
    if (parish) {
      updateMutation.mutate({ slug: parish.slug, data: values }, { onSuccess });
    } else {
      createMutation.mutate(values, { onSuccess });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Paroisse Saint-Paul" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ville</FormLabel>
              <FormControl>
                <Input placeholder="Dakar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input placeholder="12 rue de la Paix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    placeholder="14.69278"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    placeholder="-17.44667"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Actif</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {parish ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
