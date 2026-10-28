import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface Props {
  nome: string | null;
  onSave: (novoNome: string | null) => void;
}

export function InlineNameEditor({ nome, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nome ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(nome ?? '');
  }, [nome]);

  useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed !== (nome ?? '')) {
      onSave(trimmed || null);
    }
    setEditing(false);
  };

  const cancel = () => {
    setValue(nome ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className="flex-1 min-w-0 rounded-md border border-emerald-400 px-2 py-0.5 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
        />
        <button
          onClick={commit}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          title="Salvar"
        >
          <Check size={14} />
        </button>
        <button
          onClick={cancel}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          title="Cancelar"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5 min-w-0">
      <h3 className="font-semibold text-slate-900 truncate">{nome || 'Sem nome'}</h3>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-emerald-600 transition-all"
        title="Editar nome"
      >
        <Pencil size={13} />
      </button>
    </div>
  );
}
