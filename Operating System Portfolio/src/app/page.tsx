import { profile } from "@/content/profile";

// Placeholder until the kbDesk shell lands in v0.2.0.
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{profile.name}</h1>
      <p className="mt-2 opacity-70">{profile.status}</p>
    </main>
  );
}
