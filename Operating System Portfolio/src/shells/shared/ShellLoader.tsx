import { LogoMark } from "@/design/Logo";

// Shown while a shell's code is downloading, usually for a moment.
export function ShellLoader() {
  return (
    <div role="status" aria-label="Loading folioOS" className="fixed inset-0 flex items-center justify-center bg-[#07090c] text-[#f6f4ef]">
      <LogoMark variant="tile" size={52} className="folio-pulse" />
    </div>
  );
}
