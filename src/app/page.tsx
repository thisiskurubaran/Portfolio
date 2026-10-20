import { SceneLoader } from "@/scene/SceneLoader";
import { Barometer } from "@/ui/Barometer";
import { GyroToggle } from "@/ui/GyroToggle";
import { NightToggle } from "@/ui/NightToggle";
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
      <Barometer />
      <Panel />
      <PlainOffer />
      <div className="corner">
        <NightToggle />
        <GyroToggle />
      </div>
    </main>
  );
}
