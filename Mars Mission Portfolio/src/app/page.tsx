import { ui } from "@/content/ui";
import { SceneLoader } from "@/scene/SceneLoader";
import { MissionClock } from "@/ui/MissionClock";

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">{ui.srHeading}</h1>
      <SceneLoader />
      <MissionClock />
    </main>
  );
}
