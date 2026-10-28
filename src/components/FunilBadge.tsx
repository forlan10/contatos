import type { FunilEtapa } from '@/lib/supabase';

const COLORS: Record<string, string> = {
  Novo: 'bg-sky-100 text-sky-700 ring-sky-200',
  'Em Negociacao': 'bg-amber-100 text-amber-700 ring-amber-200',
  'Venda Fechada': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Perdido: 'bg-slate-200 text-slate-600 ring-slate-300',
};

interface Props {
  etapa: FunilEtapa | null;
}

export function FunilBadge({ etapa }: Props) {
  if (!etapa) return null;
  const c = COLORS[etapa] ?? COLORS.Novo;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 whitespace-nowrap ${c}`}
    >
      {etapa}
    </span>
  );
}
