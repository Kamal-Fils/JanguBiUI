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
import { useDeleteDiocese, useUpdateDiocese } from '@/lib/org/mutate-diocese';
import type { Diocese } from '@/types/org';

function EditDioceseDialog({ diocese }: { diocese: Diocese }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(diocese.name);
  const [code, setCode] = useState(diocese.code);
  const { addNotification } = useNotifications();

  const { mutate: update, isPending } = useUpdateDiocese({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Diocèse modifié',
        message: `« ${name} » a été mis à jour.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Réinitialise le formulaire sur les valeurs courantes à chaque ouverture.
      setName(diocese.name);
      setCode(diocese.code);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ id: diocese.id, name: name.trim(), code: code.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Modifier ${diocese.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le diocèse</DialogTitle>
            <DialogDescription>
              {diocese.province_name
                ? `Province : ${diocese.province_name}`
                : 'Mettre à jour les informations du diocèse.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="diocese-name" className="text-sm font-medium">
                Nom
              </label>
              <Input
                id="diocese-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="diocese-code" className="text-sm font-medium">
                Code
              </label>
              <Input
                id="diocese-code"
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

function DeleteDioceseButton({ diocese }: { diocese: Diocese }) {
  const { addNotification } = useNotifications();
  const { mutate: remove, isPending } = useDeleteDiocese({
    onSuccess: () =>
      addNotification({
        type: 'success',
        title: 'Diocèse supprimé',
        message: `« ${diocese.name} » a été supprimé.`,
      }),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label={`Supprimer ${diocese.name}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce diocèse&nbsp;?</AlertDialogTitle>
          <AlertDialogDescription>
            « {diocese.name} » sera définitivement supprimé. La suppression est
            refusée si des paroisses, doyennés ou communautés y sont rattachés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => remove(diocese.id)}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Actions admin (super_admin) sur un diocèse : édition + suppression. */
export function DioceseActions({ diocese }: { diocese: Diocese }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditDioceseDialog diocese={diocese} />
      <DeleteDioceseButton diocese={diocese} />
    </div>
  );
}
