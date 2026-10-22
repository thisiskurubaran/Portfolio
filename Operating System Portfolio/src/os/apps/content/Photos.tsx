import { certificateImages } from "@/content/photos";
import { EmptyState, Page, SectionHeader } from "@/os/apps/ui";

export default function Photos() {
  if (certificateImages.length === 0) {
    return <EmptyState icon="photos" title="Certificate scans will appear here" body="Each certificate gets a full image here once the scans are added. The Certifications app already lists them with verify links." />;
  }
  return (
    <Page wide>
      <SectionHeader title="Photos" detail="Certificates" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {certificateImages.map((img) => (
          <li key={img.src} className="overflow-hidden rounded-card border border-line bg-raised shadow-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
          </li>
        ))}
      </ul>
    </Page>
  );
}
