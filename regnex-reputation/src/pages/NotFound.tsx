import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-faint">
        <Compass width={22} height={22} />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-ink">Página no encontrada</h1>
        <p className="mt-1.5 max-w-sm text-[13.5px] text-ink-soft">
          La página que buscas no existe o se ha movido de sitio.
        </p>
      </div>
      <Link to="/">
        <Button size="sm">Volver al resumen</Button>
      </Link>
    </div>
  );
}
