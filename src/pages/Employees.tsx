import { useParams } from "react-router-dom";
import { ModulePage, type ModuleItem } from "@/components/farm/ModulePage";
import { ResourceManager } from "@/components/farm/ResourceManager";

const items: ModuleItem[] = [
  { id: "staff", label: "Employees", render: () => <ResourceManager resource="employees" section="employees" /> },
  { id: "attendance", label: "Attendance & leave", render: () => <ResourceManager resource="attendance" section="employees" addLabel="Record attendance" /> },
  { id: "payroll", label: "Salary payments", render: () => <ResourceManager resource="payroll" section="employees" /> },
  { id: "performance", label: "Performance", render: () => <ResourceManager resource="performance" section="employees" /> },
];

export default function Employees() {
  const { section } = useParams();
  return <ModulePage title="Employees" description="Staff records, attendance, pay and performance. Tasks are on the Tasks page; employee documents are under Documents." base="/employees" items={items} current={section} />;
}
