import { AccountPanel } from "@/components/farm/AccountPanel";
import { PageHeader } from "@/components/farm/kit";

export default function Account() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My account" description="Your sign-in, password and role." />
      <AccountPanel />
    </div>
  );
}
