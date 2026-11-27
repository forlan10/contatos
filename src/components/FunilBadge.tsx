const COLORS: Record<string, string> = {
  Novo: 'bg-sky-100 text-sky-700 ring-sky-200',
  'Em Negociacao': 'bg-amber-100 text-amber-700 ring-amber-200',
  'Venda Fechada': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Perdido: 'bg-slate-200 text-slate-600 ring-slate-300',
};

const PALETTE = [
  'bg-sky-100 text-sky-700 ring-sky-200',
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'bg-slate-200 text-slate-600 ring-slate-300',
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-cyan-100 text-cyan-700 ring-cyan-200',
  'bg-lime-100 text-lime-700 ring-lime-200',
  'bg-orange-100 text-orange-700 ring-orange-200',
  'bg-teal-100 text-teal-700 ring-teal-200',
  'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
];

interface Props {
  etapa: string | null;
}

export function FunilBadge({ etapa }: Props) {
  if (!etapa) return null;
  const c = COLORS[etapa] ?? PALETTE[etapa.length % PALETTE.length];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 whitespace-nowrap ${c}`}
    >
      {etapa}
    </span>
  );
}
