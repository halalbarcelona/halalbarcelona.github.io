import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquareText, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { restaurantProfile } from "@/data/restaurant";

export function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);

  const handleDemoLogin = () => {
    login();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-400 text-base font-bold text-brand-900">
            R
          </span>
          <span className="text-[15px] font-semibold">Regnex AI</span>
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-balance">
            Todo lo que dicen tus clientes, en un solo lugar.
          </h1>
          <p className="text-[15px] leading-relaxed text-brand-200">
            Regnex Reputation vigila tus reseñas de Google, avisa cuando algo
            necesita atención y te ayuda a responder sin perder horas cada semana.
          </p>

          <div className="space-y-3 pt-2">
            {[
              { icon: Star, text: "Valoración media y tendencia, siempre visibles" },
              { icon: MessageSquareText, text: "Respuestas sugeridas por IA, listas para revisar" },
              { icon: ShieldCheck, text: "Alertas inmediatas ante reseñas negativas" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon width={15} height={15} />
                </span>
                <span className="text-[13.5px] text-brand-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-brand-300">
          Preparado para {restaurantProfile.name} · {restaurantProfile.city}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-base font-bold text-accent-400">
              R
            </span>
            <span className="text-[15px] font-semibold text-ink">Regnex AI</span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
            <Sparkles width={12} height={12} />
            Regnex Reputation
          </span>

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Bienvenido de nuevo</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Gestiona tu reputación online desde un solo lugar.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleDemoLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-brand-900"
            >
              Entrar en demo
              <ArrowRight width={16} height={16} />
            </button>
            <p className="text-center text-[12px] leading-relaxed text-ink-faint">
              Acceso de demostración para {restaurantProfile.name}. No se requiere
              contraseña ni conexión real con Google.
            </p>
          </div>

          <div className="mt-10 rounded-xl border border-line bg-surface-muted p-4">
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              La conexión con Google Business Profile se activará próximamente.
              Mientras tanto, la aplicación funciona con datos de reseñas
              realistas de demostración.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
