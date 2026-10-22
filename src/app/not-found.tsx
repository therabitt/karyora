import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="text-xs uppercase tracking-widest text-text-muted font-semibold">
          404 Not Found
        </span>
        <h1 className="font-serif text-4xl text-ink">Work Not Found</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          The artwork or page you are looking for does not exist, has been
          unpublished, or was moved.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Return to Gallery</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
