import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/landing/Footer";

type Props = {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
};

export function LegalPageLayout({ title, effectiveDate, children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between gap-4">
          <Logo to="/" size="md" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-10 sm:py-14 max-w-3xl">
        <p className="text-sm text-muted-foreground">Effective {effectiveDate}</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-2">{title}</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-2 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:hover:underline">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
