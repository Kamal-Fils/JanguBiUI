'use client';

import { Loader2, Plus, Edit } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useParishes } from '@/features/allo-pretre/api/get-parishes';
import type { Parish } from '@/features/allo-pretre/api/mutations-parish';

import { ParishForm } from './parish-form';

export function AdminParishes() {
  const { data: parishes, isLoading } = useParishes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParish, setSelectedParish] = useState<Parish | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCreate = () => {
    setSelectedParish(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (parish: Parish) => {
    setSelectedParish(parish);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedParish(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Paroisses</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="size-4" />
          Nouvelle Paroisse
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(parishes || []).map((parish) => (
          <Card key={parish.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base font-medium">
                {parish.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={() => handleEdit(parish)}
              >
                <Edit className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>{parish.city}</span>
                {parish.address && <span>{parish.address}</span>}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${
                      parish.is_active ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                  <span>{parish.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedParish ? 'Modifier la paroisse' : 'Nouvelle paroisse'}
            </DialogTitle>
          </DialogHeader>
          {isDialogOpen && (
            <ParishForm
              parish={selectedParish}
              onSuccess={handleCloseDialog}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
