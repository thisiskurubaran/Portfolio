import { SceneLoader } from "@/scene/SceneLoader";
import { GyroToggle } from "@/ui/GyroToggle";
import { Panel } from "@/ui/Panel";
import { PlainLink } from "@/ui/PlainLink";
import { PlainOffer } from "@/ui/PlainOffer";

export default function Home() {
  return (
    <main>
      {/* First in the tab order so keyboard and screen reader users meet it first. */}
      <PlainLink />
      <h1 className="sr-only">Lighthouse portfolio</h1>
      <SceneLoader />
      <Panel />
      <PlainOffer />
      <div className="corner">
        <GyroToggle />
      </div>
    </main>
  );
}
