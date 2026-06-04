'use client';

import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDioceses } from '@/lib/org/get-dioceses';
import { useParishes } from '@/lib/org/get-parishes';
import { useProvinces } from '@/lib/org/get-provinces';

interface ParishSelectorProps {
  value?: number | null;
  onChange: (parishId: number | null) => void;
  disabled?: boolean;
}

export function ParishSelector({
  value,
  onChange,
  disabled = false,
}: ParishSelectorProps) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<
    number | undefined
  >();
  const [selectedDioceseId, setSelectedDioceseId] = useState<
    number | undefined
  >();

  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces();
  const { data: dioceses = [], isLoading: loadingDioceses } =
    useDioceses(selectedProvinceId);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes({
    dioceseId: selectedDioceseId,
  });

  const handleProvinceChange = (provinceIdStr: string) => {
    const id = Number(provinceIdStr);
    setSelectedProvinceId(id);
    setSelectedDioceseId(undefined);
    onChange(null);
  };

  const handleDioceseChange = (dioceseIdStr: string) => {
    const id = Number(dioceseIdStr);
    setSelectedDioceseId(id);
    onChange(null);
  };

  const handleParishChange = (parishIdStr: string) => {
    onChange(Number(parishIdStr));
  };

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="parish-selector-province"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Province
        </label>
        <Select
          onValueChange={handleProvinceChange}
          disabled={disabled || loadingProvinces}
        >
          <SelectTrigger id="parish-selector-province">
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

      <div>
        <label
          htmlFor="parish-selector-diocese"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Diocèse
        </label>
        <Select
          onValueChange={handleDioceseChange}
          disabled={disabled || !selectedProvinceId || loadingDioceses}
        >
          <SelectTrigger id="parish-selector-diocese">
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

      <div>
        <label
          htmlFor="parish-selector-parish"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Paroisse
        </label>
        <Select
          value={value ? String(value) : undefined}
          onValueChange={handleParishChange}
          disabled={disabled || !selectedDioceseId || loadingParishes}
        >
          <SelectTrigger id="parish-selector-parish">
            <SelectValue placeholder="Sélectionner une paroisse" />
          </SelectTrigger>
          <SelectContent>
            {parishes.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
                {p.city ? ` — ${p.city}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
