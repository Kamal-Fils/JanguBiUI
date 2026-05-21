'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import type { ServiceType } from '@/features/allo-pretre/api/mutations-service';
import {
  useCreateService,
  useUpdateService,
} from '@/features/allo-pretre/api/mutations-service';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(0).optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service: ServiceType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServiceForm({
  service,
  onSuccess,
  onCancel,
}: ServiceFormProps) {
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      duration_minutes: service?.duration_minutes || 60,
    },
  });

  const onSubmit = (values: ServiceFormValues) => {
    if (service) {
      updateMutation.mutate(
        { slug: service.slug, data: values },
        { onSuccess },
      );
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
              <FormLabel>Nom du service</FormLabel>
              <FormControl>
                <Input placeholder="Baptême, Rencontre..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optionnelle)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Célébration du sacrement de Baptême..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée estimée (minutes)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="60" {...field} />
              </FormControl>
              <FormMessage />
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
            {service ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
