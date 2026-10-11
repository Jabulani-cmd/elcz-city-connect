import { PageHeader } from "@/components/farm/kit";
import { ResourceManager } from "@/components/farm/ResourceManager";

export default function Documents() {
  return (
    <div>
      <PageHeader title="Documents" description="Registrations, permits, contracts, vet certificates, receipts and employee files. Files stay on this device." />
      <ResourceManager resource="documents" section="documents" hideTitle />
    </div>
  );
}
