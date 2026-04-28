import Image from "next/image";

type BrandMarkProps = {
  subtitle?: string;
  size?: "sm" | "md";
};

export function BrandMark({ subtitle, size = "md" }: BrandMarkProps) {
  const imageSize = size === "sm" ? "h-7 w-12" : "h-8 w-14";

  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={`relative shrink-0 overflow-hidden rounded-md border border-border bg-background ${imageSize}`}
      >
        <Image
          src="/vault_logo.png"
          alt="Notes Vault logo"
          fill
          sizes={size === "sm" ? "48px" : "56px"}
          className="object-contain"
          priority={size === "md"}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-none">
          Notes Vault
        </span>
        {subtitle ? (
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
