import { createFileRoute } from "@tanstack/react-router";
import { SimCanvas } from "@/components/sim/SimCanvas";
import { Interface } from "@/components/sim/Interface";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Yield Atlas — Historical Bomb Simulation on a 3D Earth" },
      {
        name: "description",
        content:
          "Explore historical conventional and nuclear weapons on an interactive 3D Earth with cinematic, scientifically inspired blast simulations.",
      },
      { property: "og:title", content: "Yield Atlas — Historical Bomb Simulation" },
      { property: "og:description", content: "Interactive 3D globe simulating historical weapon yields, shockwaves and mushroom clouds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="fixed inset-0 bg-background">
      <div className="absolute inset-0">
        <SimCanvas />
      </div>
      <Interface />
    </main>
  );
}
