import Image from "next/image";
import { sitePhotos } from "@/lib/photo-credits";

export const metadata = { title: "Photo credits | Mobile Vet" };

export default function CreditsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Photo credits</h1>
      <p className="mt-3 text-muted">
        Photography on this site comes from Wikimedia Commons. We thank the photographers. Images were resized and
        shown with colour overlays; each remains available under its original licence.
      </p>
      <ul className="mt-10 space-y-5">
        {Object.values(sitePhotos).map((p) => (
          <li key={p.src} className="card flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
              <Image src={p.src} alt={p.alt} fill sizes="200px" className="object-cover" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{p.title}</div>
              <div className="mt-1 text-muted">Photo: {p.author}</div>
              <div className="mt-1 text-muted">
                Licence:{" "}
                {p.licenseUrl ? <a href={p.licenseUrl} className="text-primary hover:underline" target="_blank" rel="noreferrer">{p.license}</a> : p.license}
              </div>
              <a href={p.source} className="mt-2 inline-block text-primary hover:underline" target="_blank" rel="noreferrer">View original on Wikimedia Commons</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
