import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { ClergyDeclarationPanel } from '@/features/clergy-declaration/components/clergy-declaration-panel';

export default function ClergyDeclarationPage() {
  return (
    <div className="mx-auto w-full max-w-2xl md:max-w-3xl">
      <PageHeader
        title="Mon ministère"
        subtitle="Déclarez le rôle que vous exercez dans l’Église et suivez la décision de votre autorité hiérarchique."
        backHref={paths.app.profil.getHref()}
        backLabel="Retour au profil"
      />
      <ClergyDeclarationPanel />
    </div>
  );
}
