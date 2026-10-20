import { SceneLoader } from "@/scene/SceneLoader";
import { GyroToggle } from "@/ui/GyroToggle";
import { Panel } from "@/ui/Panel";

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">Lighthouse portfolio</h1>
      <SceneLoader />
      <Panel />
      <div className="corner">
        <GyroToggle />
      </div>
    </main>
  );
}
