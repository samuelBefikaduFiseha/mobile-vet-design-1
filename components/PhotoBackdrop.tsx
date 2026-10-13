import Image from "next/image";
import type { SitePhoto } from "@/lib/photo-credits";

const overlays = {
  // Readable dark text on the left, photo showing through on the right.
  light:
    "bg-background/85 md:bg-transparent md:bg-[linear-gradient(90deg,rgba(246,244,238,0.97)_0%,rgba(246,244,238,0.9)_38%,rgba(246,244,238,0.55)_70%,rgba(246,244,238,0.3)_100%)]",
  // Brand-green tint for white text (sign-in panel, call-to-action bands).
  green:
    "bg-[linear-gradient(160deg,rgba(11,36,22,0.93)_0%,rgba(20,73,47,0.82)_45%,rgba(29,107,71,0.62)_100%)]",
  // Barely-there texture behind ordinary content.
  wash: "bg-background/[0.9]",
} as const;

/** Full-bleed background photo with a translucent overlay. Place inside a `relative` container. */
export function PhotoBackdrop({ photo, tone = "light", position = "center", priority = false }: {
  photo: SitePhoto; tone?: keyof typeof overlays; position?: string; priority?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden={tone === "wash"}>
      <Image src={photo.src} alt={tone === "wash" ? "" : photo.alt} fill priority={priority} sizes="100vw"
        className="object-cover" style={{ objectPosition: position }} />
      <div className={`absolute inset-0 ${overlays[tone]}`} />
    </div>
  );
}
