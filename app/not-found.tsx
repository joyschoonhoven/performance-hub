import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hub-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">⚽</div>
        <h1 className="text-4xl font-black text-white">404</h1>
        <p className="text-slate-400">Pagina niet gevonden</p>
        <Link href="/" className="hub-btn-primary inline-block">
          Terug naar dashboard
        </Link>
      </div>
    </div>
  );
}
