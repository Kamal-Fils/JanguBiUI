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
import { useCreateDiocese } from '@/lib/org/create-diocese';
import { useProvinces } from '@/lib/org/get-provinces';

interface CreateDioceseDialogProps {
  /** Province présélectionnée (ex. filtre actif de la page admin). */
  defaultProvinceId?: number;
}

/** Bouton + dialogue de création d'un diocèse (super_admin). */
export function CreateDioceseDialog({
  defaultProvinceId,
}: CreateDioceseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [provinceId, setProvinceId] = useState<number | undefined>(
    defaultProvinceId,
  );
  const { addNotification } = useNotifications();
  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces();

  const { mutate: create, isPending } = useCreateDiocese({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Diocèse créé',
        message: `« ${name.trim()} » a été ajouté.`,
      });
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      // Formulaire vierge à chaque ouverture, province du filtre présélectionnée.
      setName('');
      setCode('');
      setProvinceId(defaultProvinceId);
    }
    setOpen(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!provinceId) return;
    create({ name: name.trim(), code: code.trim(), province_id: provinceId });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" icon={<Plus className="size-4" />}>
          Nouveau diocèse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nouveau diocèse</DialogTitle>
            <DialogDescription>
              Créer un diocèse rattaché à une province (niveau 2 de la
              structure territoriale).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="new-diocese-name" className="text-sm font-medium">
                Nom
              </label>
              <Input
                id="new-diocese-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Diocèse de Thiès"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-diocese-code" className="text-sm font-medium">
                Code
              </label>
              <Input
                id="new-diocese-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="THS"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-diocese-province"
                className="text-sm font-medium"
              >
                Province
              </label>
              <Select
                value={provinceId ? String(provinceId) : undefined}
                onValueChange={(v) => setProvinceId(Number(v))}
                disabled={loadingProvinces}
              >
                <SelectTrigger id="new-diocese-province">
                  <SelectValue placeholder="Sélectionner une province" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!name.trim() || !code.trim() || !provinceId}
            >
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
