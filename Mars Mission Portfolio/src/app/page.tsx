import { ui } from "@/content/ui";
import { SceneLoader } from "@/scene/SceneLoader";
import { HudLoader } from "@/ui/HudLoader";
import { MissionClock } from "@/ui/MissionClock";
import { PlainLink } from "@/ui/PlainLink";
import { PlainOffer } from "@/ui/PlainOffer";

export default function Home() {
  return (
    <main>
      {/* First in the tab order so keyboard and screen reader users meet it first. */}
      <PlainLink />
      <h1 className="sr-only">{ui.srHeading}</h1>
      <SceneLoader />
      <MissionClock />
      <HudLoader />
      <PlainOffer />
    </main>
  );
}
