const COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'em analise': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  cliente: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  familia: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  trabalho: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
  fornecedor: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  ignorado: { bg: 'bg-slate-200', text: 'text-slate-600', ring: 'ring-slate-300' },
};

interface Props {
  tipo: string;
}

export function TipoBadge({ tipo }: Props) {
  const c = COLORS[tipo] ?? COLORS.ignorado;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} ring-1 ${c.ring} capitalize whitespace-nowrap`}
    >
      {tipo}
    </span>
  );
}
