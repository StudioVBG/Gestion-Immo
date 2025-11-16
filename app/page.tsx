import dynamic from "next/dynamic";

// Charger le composant uniquement côté client pour éviter les problèmes SSR avec Framer Motion
const HomeClient = dynamic(() => import("./home-client"), {
  ssr: false,
  loading: () => (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  ),
});

export default function Home() {
  return <HomeClient />;
}
