import { certificateImages } from "@/content/photos";

export default function Photos() {
  if (certificateImages.length === 0) {
    return <p className="p-6 text-sm opacity-70">No certificate images have been added yet.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3 p-6">
      {certificateImages.map((img) => (
        // eslint-disable-next-line @next/next/no-img-element
        <li key={img.src}><img src={img.src} alt={img.alt} className="w-full rounded-control" loading="lazy" /></li>
      ))}
    </ul>
  );
}
