'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

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
import { useCreateProvince } from '@/lib/org/create-province';

/** Bouton + dialogue de création d'une province (super_admin). */
export function CreateProvinceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('');
  const { addNotification } = useNotifications();

  const { mutate: create, isPending } = useCreateProvince({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Province créée',
        message: `« ${name.trim()} » a été ajoutée.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Formulaire vierge à chaque ouverture.
      setName('');
      setCode('');
      setCountry('');
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create({
      name: name.trim(),
      code: code.trim(),
      ...(country.trim() ? { country: country.trim() } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" icon={<Plus className="size-4" />}>
          Nouvelle province
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouvelle province</DialogTitle>
            <DialogDescription>
              Créer une province ecclésiastique (niveau 1 de la structure
              territoriale).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label
                htmlFor="new-province-name"
                className="text-sm font-medium"
              >
                Nom
              </label>
              <Input
                id="new-province-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Province ecclésiastique de Dakar"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-province-code"
                className="text-sm font-medium"
              >
                Code
              </label>
              <Input
                id="new-province-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DKR"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-province-country"
                className="text-sm font-medium"
              >
                Pays (optionnel)
              </label>
              <Input
                id="new-province-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Sénégal"
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
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
