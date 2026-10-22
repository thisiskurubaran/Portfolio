"use client";

import { NotificationList } from "@/shells/shared/NotificationList";
import { Sheet } from "@/shells/shared/Sheet";
import { usePhone } from "./state";

export function NotificationShade() {
  const setOverlay = usePhone((s) => s.setOverlay);
  return (
    <Sheet label="Notifications" onClose={() => setOverlay(null)}>
      <NotificationList />
    </Sheet>
  );
}
