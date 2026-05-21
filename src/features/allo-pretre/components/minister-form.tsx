'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { ChangeEvent, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Minister } from '@/features/allo-pretre/api/get-ministers';
import { useParishes } from '@/features/allo-pretre/api/get-parishes';
import {
  useCreateMinister,
  useUpdateMinister,
} from '@/features/allo-pretre/api/mutations-minister';

const ministerSchema = z.object({
  first_name: z.string().min(1, 'Prenom requis'),
  last_name: z.string().min(1, 'Nom de famille requis'),
  role: z.enum(['PRIEST', 'SISTER', 'DEACON', 'RELIGIOUS', 'BISHOP'], {
    required_error: 'Le role est obligatoire',
  }),
  parish_id: z.coerce.number().min(1, 'La paroisse est obligatoire'),
  is_active: z.boolean().default(true),
});

type MinisterFormValues = z.infer<typeof ministerSchema>;

interface MinisterFormProps {
  minister: Minister | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MinisterForm({
  minister,
  onSuccess,
  onCancel,
}: MinisterFormProps) {
  const { data: parishes } = useParishes();
  const createMutation = useCreateMinister();
  const updateMutation = useUpdateMinister();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    minister?.photo || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<MinisterFormValues>({
    resolver: zodResolver(ministerSchema),
    defaultValues: {
      first_name: minister?.first_name || '',
      last_name: minister?.last_name || '',
      role: minister?.role || 'PRIEST',
      parish_id: minister?.parish?.id || 0,
      is_active: minister?.is_active ?? true,
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const onSubmit = (values: MinisterFormValues) => {
    const payload = {
      ...values,
      photo: selectedFile || undefined,
    };

    if (minister) {
      updateMutation.mutate(
        { slug: minister.slug, data: payload },
        { onSuccess },
      );
    } else {
      createMutation.mutate(payload, { onSuccess });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-6">
          <button
            type="button"
            className="group relative size-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted transition-colors hover:border-accent cursor-pointer flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Choisir une photo de profil"
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            ) : (
              <ImagePlus className="size-8 text-muted-foreground/50 group-hover:text-accent" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">Modifier</span>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Photo de profil (optionnelle)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prenom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner le role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PRIEST">Prêtre</SelectItem>
                    <SelectItem value="SISTER">Sœur</SelectItem>
                    <SelectItem value="DEACON">Diacre</SelectItem>
                    <SelectItem value="RELIGIOUS">Frère Religieux</SelectItem>
                    <SelectItem value="BISHOP">Évêque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parish_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paroisse</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Affecter à une paroisse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(parishes || []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormLabel>Actif (Visible dans l&apos;annuaire)</FormLabel>
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
            {minister ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
