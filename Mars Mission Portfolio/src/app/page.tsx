import { ui } from "@/content/ui";
import { SceneLoader } from "@/scene/SceneLoader";
import { BodyPanel } from "@/ui/BodyPanel";
import { MissionClock } from "@/ui/MissionClock";
import { TimeWarp } from "@/ui/TimeWarp";

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">{ui.srHeading}</h1>
      <SceneLoader />
      <MissionClock />
      <BodyPanel />
      <TimeWarp />
    </main>
  );
}
