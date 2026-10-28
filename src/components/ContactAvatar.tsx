interface Props {
  nome: string | null;
  tipo?: string;
  size?: 'sm' | 'md';
}

const INITIAL_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
];

export function ContactAvatar({ nome, size = 'md' }: Props) {
  const initial = (nome?.trim()?.[0] ?? '?').toUpperCase();
  const idx = (nome?.charCodeAt(0) ?? 0) % INITIAL_COLORS.length;
  const bg = INITIAL_COLORS[idx] ?? 'bg-emerald-600';
  const sz =
    size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';

  return (
    <div
      className={`shrink-0 rounded-full ${bg} text-white font-semibold flex items-center justify-center ${sz} shadow-sm`}
    >
      {initial}
    </div>
  );
}
