'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/dialog';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { useDeleteProvince, useUpdateProvince } from '@/lib/org/mutate-province';
import type { Province } from '@/types/org';

function EditProvinceDialog({ province }: { province: Province }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(province.name);
  const [code, setCode] = useState(province.code);
  const { addNotification } = useNotifications();

  const { mutate: update, isPending } = useUpdateProvince({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Province modifiée',
        message: `« ${name} » a été mise à jour.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Réinitialise le formulaire sur les valeurs courantes à chaque ouverture.
      setName(province.name);
      setCode(province.code);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ id: province.id, name: name.trim(), code: code.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier ${province.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier la province</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de la province ecclésiastique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="province-name" className="text-sm font-medium">
                Nom
              </label>
              <Input
                id="province-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="province-code" className="text-sm font-medium">
                Code
              </label>
              <Input
                id="province-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!name.trim() || !code.trim()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProvinceButton({ province }: { province: Province }) {
  const { addNotification } = useNotifications();
  const { mutate: remove, isPending } = useDeleteProvince({
    onSuccess: () =>
      addNotification({
        type: 'success',
        title: 'Province supprimée',
        message: `« ${province.name} » a été supprimée.`,
      }),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label={`Supprimer ${province.name}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette province&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            « {province.name} » sera définitivement supprimée. La suppression
            est refusée si des diocèses y sont rattachés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => remove(province.id)}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Actions admin (super_admin) sur une province : édition + suppression. */
export function ProvinceActions({ province }: { province: Province }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditProvinceDialog province={province} />
      <DeleteProvinceButton province={province} />
    </div>
  );
}
