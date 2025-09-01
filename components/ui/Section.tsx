import * as React from "react";
import { cn } from "@/lib/utils";

export default function Section({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("w-full", className)} {...props}>
      {children}
    </section>
  );
}
