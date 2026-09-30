import { site } from "@/lib/site";

/**
 * Marks an invented figure or claim. Only shown when the concept flag is on, so a real
 * business's name never sits beside a number it didn't give us.
 */
export function Sample({ className = "", label = "sample" }: { className?: string; label?: string }) {
  if (!site.showConceptBanner) return null;
  return (
    <span className={`sample-tag ${className}`} title="Sample content for this concept">
      {label}
    </span>
  );
}
