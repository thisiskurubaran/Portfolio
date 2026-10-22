import { Icon } from "@/design/icons";

// Shown while a shell's code is downloading, usually for a moment.
export function ShellLoader() {
  return (
    <div role="status" aria-label="Loading kbOS" className="fixed inset-0 flex items-center justify-center bg-[#07090c] text-[#f6f4ef]">
      <Icon name="logo" size={40} className="kb-pulse opacity-70" />
    </div>
  );
}
