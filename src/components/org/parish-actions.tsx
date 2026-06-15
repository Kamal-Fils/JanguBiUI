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
import { useDeleteParish, useUpdateParish } from '@/lib/org/mutate-parish';
import type { Parish } from '@/types/org';

function EditParishDialog({ parish }: { parish: Parish }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(parish.name);
  const [city, setCity] = useState(parish.city ?? '');
  const [address, setAddress] = useState(parish.address ?? '');
  const { addNotification } = useNotifications();

  const { mutate: update, isPending } = useUpdateParish({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Paroisse modifiée',
        message: `« ${name} » a été mise à jour.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Réinitialise le formulaire sur les valeurs courantes à chaque ouverture.
      setName(parish.name);
      setCity(parish.city ?? '');
      setAddress(parish.address ?? '');
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ id: parish.id, name: name.trim(), city, address });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier ${parish.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier la paroisse</DialogTitle>
            <DialogDescription>
              {parish.diocese_name
                ? `Diocèse : ${parish.diocese_name}`
                : 'Mettre à jour les informations de la paroisse.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="parish-name" className="text-sm font-medium">
                Nom
              </label>
              <Input
                id="parish-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="parish-city" className="text-sm font-medium">
                Ville
              </label>
              <Input
                id="parish-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="parish-address" className="text-sm font-medium">
                Adresse
              </label>
              <Input
                id="parish-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
            <Button type="submit" isLoading={isPending} disabled={!name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteParishButton({ parish }: { parish: Parish }) {
  const { addNotification } = useNotifications();
  const { mutate: remove, isPending } = useDeleteParish({
    onSuccess: () =>
      addNotification({
        type: 'success',
        title: 'Paroisse supprimée',
        message: `« ${parish.name} » a été supprimée.`,
      }),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label={`Supprimer ${parish.name}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette paroisse&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            « {parish.name} » sera définitivement supprimée. La suppression est
            refusée si des appartenances, affectations ou contributions y sont
            rattachées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => remove(parish.id)}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Actions admin (super_admin) sur une ligne de paroisse : édition + suppression. */
export function ParishActions({ parish }: { parish: Parish }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditParishDialog parish={parish} />
      <DeleteParishButton parish={parish} />
    </div>
  );
}
