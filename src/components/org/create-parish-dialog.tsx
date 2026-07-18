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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateParish } from '@/lib/org/create-parish';
import { useDioceses } from '@/lib/org/get-dioceses';

interface CreateParishDialogProps {
  /** Diocèse présélectionné (ex. filtre actif de la page admin). */
  defaultDioceseId?: number;
}

/** Bouton + dialogue de création d'une paroisse (super_admin). */
export function CreateParishDialog({
  defaultDioceseId,
}: CreateParishDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [dioceseId, setDioceseId] = useState<number | undefined>(
    defaultDioceseId,
  );
  const { addNotification } = useNotifications();
  const { data: dioceses = [], isLoading: loadingDioceses } = useDioceses();

  const { mutate: create, isPending } = useCreateParish({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Paroisse créée',
        message: `« ${name.trim()} » a été ajoutée.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Formulaire vierge à chaque ouverture, diocèse du filtre présélectionné.
      setName('');
      setCity('');
      setAddress('');
      setDioceseId(defaultDioceseId);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dioceseId) return;
    create({
      name: name.trim(),
      diocese_id: dioceseId,
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(address.trim() ? { address: address.trim() } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" icon={<Plus className="size-4" />}>
          Nouvelle paroisse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouvelle paroisse</DialogTitle>
            <DialogDescription>
              Créer une paroisse rattachée à un diocèse (niveau 3 de la
              structure territoriale).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="new-parish-name" className="text-sm font-medium">
                Nom
              </label>
              <Input
                id="new-parish-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Paroisse Saint-Joseph"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-parish-diocese"
                className="text-sm font-medium"
              >
                Diocèse
              </label>
              <Select
                value={dioceseId ? String(dioceseId) : undefined}
                onValueChange={(v) => setDioceseId(Number(v))}
                disabled={loadingDioceses}
              >
                <SelectTrigger id="new-parish-diocese">
                  <SelectValue placeholder="Sélectionner un diocèse" />
                </SelectTrigger>
                <SelectContent>
                  {dioceses.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-parish-city" className="text-sm font-medium">
                Ville (optionnel)
              </label>
              <Input
                id="new-parish-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dakar"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-parish-address"
                className="text-sm font-medium"
              >
                Adresse (optionnel)
              </label>
              <Input
                id="new-parish-address"
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
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!name.trim() || !dioceseId}
            >
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
