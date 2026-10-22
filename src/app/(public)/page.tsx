import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 py-12 md:py-20">
      {/* Editorial Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <Badge variant="open">Commissions Open</Badge>
              <span className="text-xs text-text-muted">Independent Digital & Traditional Artist</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.08]">
              Where imagination finds its deliberate form.
            </h1>

            <p className="text-lg text-ink-soft leading-relaxed max-w-xl">
              Welcome to Karyora. Explore curated original character art,
              digital paintings, and illustrative works. Inquiries for private
              and commercial commissions are currently being accepted.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/gallery">
                <Button variant="primary" size="lg">
                  Explore Gallery
                </Button>
              </Link>
              <Link href="/commission">
                <Button variant="outline" size="lg">
                  Commission Information
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-4/5 rounded-2xl bg-surface-muted border border-border overflow-hidden flex items-center justify-center p-8 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent-soft flex items-center justify-center text-accent font-serif text-2xl">
                  K
                </div>
                <p className="font-serif text-xl text-ink">Featured Artwork Space</p>
                <p className="text-xs text-text-muted max-w-xs">
                  Published works marked as featured by the artist appear here in full exhibition format.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Works Gallery Teaser */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-3xl text-ink">Selected Works</h2>
            <p className="text-sm text-text-muted mt-1">
              Recent paintings, character designs, and illustrations.
            </p>
          </div>
          <Link
            href="/gallery"
            className="text-sm font-medium text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors"
          >
            <span>View All Works</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="overflow-hidden group hover:border-border-strong transition-all">
              <div className="aspect-4/3 bg-surface-muted flex items-center justify-center text-text-muted text-sm">
                Exhibition Preview #{item}
              </div>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Digital Painting</span>
                  <span>2026</span>
                </div>
                <h3 className="font-serif text-lg text-ink group-hover:text-accent transition-colors">
                  Artwork Title Placeholder #{item}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Commission Inquiry Call-to-Action */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-surface rounded-2xl border border-border p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <Badge variant="open">Availability Status</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink">
            Have a project or vision in mind?
          </h2>
          <p className="text-base text-ink-soft leading-relaxed max-w-xl mx-auto">
            Review available commission offerings, starting rates, and terms of service, then submit an inquiry for consideration.
          </p>
          <div className="pt-2">
            <Link href="/commission">
              <Button variant="primary" size="lg">
                View Offerings & Inquire
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
