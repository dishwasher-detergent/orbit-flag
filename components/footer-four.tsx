import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  {
    title: "Features",
    href: "#features",
  },
];

export default function FooterSection() {
  return (
    <footer className="bg-background border-b py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap justify-between gap-12">
          <div className="order-last flex items-center gap-3 md:order-first">
            <Link href="#" aria-label="go home">
              <Logo className="size-5" />
            </Link>
            <span className="text-muted-foreground block text-center text-sm">
              © {new Date().getFullYear()} Orbit Flag, All rights reserved
            </span>
          </div>

          <div className="order-first flex flex-wrap gap-x-6 gap-y-4 md:order-last">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-primary block duration-150"
              >
                <span>{link.title}</span>
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
