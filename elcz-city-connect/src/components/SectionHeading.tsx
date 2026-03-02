import { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  children?: ReactNode;
}

const SectionHeading = ({ title, subtitle, centered = true }: SectionHeadingProps) => {
  return (
    <div className={`mb-6 sm:mb-10 ${centered ? "text-center" : ""}`}>
      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</p>
      )}
      <div className={`mt-4 h-1 w-16 bg-primary rounded-full ${centered ? "mx-auto" : ""}`} />
    </div>
  );
};

export default SectionHeading;
