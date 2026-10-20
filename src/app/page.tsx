import { SceneLoader } from "@/scene/SceneLoader";
import { GyroToggle } from "@/ui/GyroToggle";

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">Lighthouse portfolio</h1>
      <SceneLoader />
      <div className="corner">
        <GyroToggle />
      </div>
    </main>
  );
}
