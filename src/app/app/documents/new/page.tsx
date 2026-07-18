import { NewDocumentForm } from '@/features/documents/components/new-document-form';

/**
 * Création d'une demande de document (fidèle). Vue plein écran EXEMPTÉE du
 * PageMeta/AppHeader (cf. commentaire d'`AppHeader`) : le formulaire porte son
 * propre en-tête sticky dont le bouton retour est conscient des étapes
 * (revenir à l'étape précédente, pas quitter le tunnel).
 */
export default function NewDocumentPage() {
  return <NewDocumentForm />;
}
