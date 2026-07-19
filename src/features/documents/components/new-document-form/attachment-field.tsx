'use client';

import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { useRef } from 'react';

import { Card } from '@/components/ui/card/card';

import { errorClass } from './form-field-classes';

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png';

/**
 * Champ de pièce jointe : sélection, téléversement en cours, fichier retenu,
 * retrait. Le composant est purement présentationnel — la validation de taille
 * et l'appel de téléversement restent au formulaire, qui seul sait relier le
 * fichier obtenu à `attachment_file_id`.
 */
export interface AttachmentFieldProps {
  fileName: string | null;
  fileError: string | null;
  isUploading: boolean;
  isUploaded: boolean;
  onSelectFile: (file: File) => void;
  onClear: () => void;
}

export function AttachmentField({
  fileName,
  fileError,
  isUploading,
  isUploaded,
  onSelectFile,
  onClear,
}: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <p className="text-xs text-muted-foreground">
        Ajoutez un justificatif (acte de naissance, livret de famille, etc.) —
        formats acceptés&nbsp;: PDF, JPG, PNG. Taille max&nbsp;: 10&nbsp;Mo.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          // Allow re-selecting the same file later
          e.target.value = '';
        }}
        aria-label="Sélectionner un fichier"
      />

      {!fileName && !isUploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Paperclip
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
          <span className="text-sm font-medium text-foreground">
            Choisir un fichier
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, JPG ou PNG · 10&nbsp;Mo max
          </span>
        </button>
      )}

      {isUploading && (
        <Card variant="elevated" className="flex items-center gap-3 px-4 py-3">
          <Loader2
            aria-hidden="true"
            className="size-5 animate-spin text-primary"
          />
          <span className="text-sm text-muted-foreground">
            Téléversement en cours…
          </span>
        </Card>
      )}

      {fileName && !isUploading && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
          <FileText
            aria-hidden="true"
            className="size-5 shrink-0 text-primary"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {fileName}
            </span>
            {isUploaded && (
              <span className="text-xs text-primary">
                Téléversé avec succès
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Retirer le fichier"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}

      {fileError && (
        <p className={errorClass} role="alert">
          {fileError}
        </p>
      )}
    </>
  );
}
