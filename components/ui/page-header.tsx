import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children && <div>{children}</div>}
    </header>
  );
}
