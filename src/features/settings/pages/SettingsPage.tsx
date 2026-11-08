import { PageHeader } from '@/components/common/PageHeader';
import { DataExportCard } from '../components/DataExportCard';
import { MessageTemplatesForm } from '../components/MessageTemplatesForm';
import { StaffAccountsInfo } from '../components/StaffAccountsInfo';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Settings" description="The wording of your messages, who can log in, and your data." />

      <section aria-label="Message wording" className="space-y-3">
        <h2 className="text-lg font-semibold">Message wording</h2>
        <MessageTemplatesForm />
      </section>

      <section aria-label="Logins" className="space-y-3">
        <h2 className="text-lg font-semibold">Logins</h2>
        <StaffAccountsInfo />
      </section>

      <section aria-label="Download your data" className="space-y-3">
        <h2 className="text-lg font-semibold">Download your data</h2>
        <DataExportCard />
      </section>
    </div>
  );
}
