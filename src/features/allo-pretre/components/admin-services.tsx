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
import { useServices } from '@/features/allo-pretre/api/get-services';
import type { ServiceType } from '@/features/allo-pretre/api/mutations-service';

import { ServiceForm } from './service-form';

export function AdminServices() {
  const { data: services, isLoading } = useServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCreate = () => {
    setSelectedService(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (service: ServiceType) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Types de Services
        </h2>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="size-4" />
          Nouveau Service
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(services || []).map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base font-medium">
                {service.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={() => handleEdit(service)}
              >
                <Edit className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="line-clamp-2">{service.description}</span>
                <span className="font-medium">
                  Duree: {service.duration_minutes || 0} min
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Modifier le service' : 'Nouveau service'}
            </DialogTitle>
          </DialogHeader>
          {isDialogOpen && (
            <ServiceForm
              service={selectedService}
              onSuccess={handleCloseDialog}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
