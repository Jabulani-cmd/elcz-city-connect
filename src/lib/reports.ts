import { sum, toNum, todayISO } from "./calc";
import { rowsOf } from "./store";
import type { Row } from "./types";

export type ReportSection = {
  title: string;
  data: { label: string; value: string | number }[];
  details?: Row[];
};

export type FarmReport = {
  title: string;
  date: string;
  sections: ReportSection[];
};

export function generateFinancialReport(): FarmReport {
  const income = rowsOf("income");
  const expenses = rowsOf("expenses");

  const totalIncome = sum(income, "amount");
  const totalExpenses = sum(expenses, "amount");
  const netProfit = totalIncome - totalExpenses;

  return {
    title: "Financial Audit Report",
    date: todayISO(),
    sections: [
      {
        title: "Executive Summary",
        data: [
          { label: "Total Revenue", value: totalIncome.toFixed(2) },
          { label: "Total Expenses", value: totalExpenses.toFixed(2) },
          { label: "Net Profit", value: netProfit.toFixed(2) },
        ],
      },
      {
        title: "Detailed Expenses",
        data: [],
        details: expenses.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      },
      {
        title: "Detailed Income",
        data: [],
        details: income.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      },
    ],
  };
}

export function generateHealthReport(): FarmReport {
  const health = rowsOf("health");
  const vax = rowsOf("vaccinations");

  const totalIssues = health.length;
  const resolved = health.filter(h => h.recovery !== "Ongoing").length;

  return {
    title: "Animal Health & Welfare Report",
    date: todayISO(),
    sections: [
      {
        title: "Health Summary",
        data: [
          { label: "Total Health Records", value: totalIssues },
          { label: "Resolved Cases", value: resolved },
          { label: "Ongoing Treatments", value: totalIssues - resolved },
        ],
      },
      {
        title: "Vaccination History",
        data: [],
        details: vax.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      },
      {
        title: "Health Records",
        data: [],
        details: health.sort((a, b) => (a.date || "").localeCompare(b.date || "")),
      },
    ],
  };
}

export function generateOperationalReport(): FarmReport {
  const tasks = rowsOf("tasks");
  const completed = tasks.filter(t => t.status === "Done").length;
  const total = tasks.length;

  return {
    title: "Operational Performance Report",
    date: todayISO(),
    sections: [
      {
        title: "Task Efficiency",
        data: [
          { label: "Total Tasks Assigned", value: total },
          { label: "Tasks Completed", value: completed },
          { label: "Completion Rate", value: total ? `${((completed/total)*100).toFixed(1)}%` : "0%" },
        ],
      },
      {
        title: "Task Log",
        data: [],
        details: tasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")),
      },
    ],
  };
}
