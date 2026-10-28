import { useEffect, useMemo, useState } from 'react';
import {
  cleanWhatsAppNumber,
  fetchClientes,
  TIPO_OPTIONS,
  updateContato,
  whatsappLink,
  type Contato,
  type ContatoTipo,
} from '@/lib/supabase';
import {
  AlertTriangle,
  Check,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { TipoBadge } from './TipoBadge';

export function ClientesTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientes();
      setContatos(data);
    } catch (err) {
      console.error('[ClientesTab] erro ao buscar clientes:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contatos;
    return contatos.filter((c) => {
      const nome = (c.nome ?? '').toLowerCase();
      const num = cleanWhatsAppNumber(c.numero).toLowerCase();
      const desc = (c.descricao ?? '').toLowerCase();
      return nome.includes(q) || num.includes(q) || desc.includes(q);
    });
  }, [contatos, query]);

  const handleUpdate = async (
    id: number,
    patch: Partial<Pick<Contato, 'descricao' | 'tipo'>>
  ) => {
    try {
      await updateContato(id, patch);
      setContatos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    } catch (err) {
      console.error('[ClientesTab] erro ao atualizar contato:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setError(msg);
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-800">Esteira de clientes</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {contatos.length}
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, número ou descrição"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors bg-white"
          />
        </div>
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={query.trim().length > 0} onClear={() => setQuery('')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ClienteCard
              key={c.id}
              contato={c}
              editing={editingId === c.id}
              onStartEdit={() => setEditingId(c.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => {
                handleUpdate(c.id, patch);
                setEditingId(null);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ClienteCard({
  contato,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  contato: Contato;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: Partial<Pick<Contato, 'descricao' | 'tipo'>>) => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);
  const [desc, setDesc] = useState(contato.descricao ?? '');
  const [tipo, setTipo] = useState<ContatoTipo>(contato.tipo);

  useEffect(() => {
    setDesc(contato.descricao ?? '');
    setTipo(contato.tipo);
  }, [contato]);

  const save = () => {
    const patch: Partial<Pick<Contato, 'descricao' | 'tipo'>> = {};
    if (desc.trim() !== (contato.descricao ?? '').trim()) patch.descricao = desc.trim();
    if (tipo !== contato.tipo) patch.tipo = tipo;
    onSave(patch);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 truncate">
              {contato.nome || 'Sem nome'}
            </h3>
            <TipoBadge tipo={contato.tipo} />
          </div>
          <p className="text-sm text-slate-500 font-mono truncate">{clean || '—'}</p>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Status / tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ContatoTipo)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white"
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Descrição
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Notas sobre o cliente…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancelEdit}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <X size={15} />
              Cancelar
            </button>
            <button
              onClick={save}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Check size={15} />
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <>
          {contato.descricao ? (
            <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-100 whitespace-pre-wrap">
              {contato.descricao}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400 italic">Sem descrição.</p>
          )}

          <div className="mt-4 flex gap-2">
            <a
              href={whatsappLink(contato.numero)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm shadow-emerald-600/20"
            >
              <Phone size={15} />
              Abrir no WhatsApp
            </a>
            <button
              onClick={onStartEdit}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Editar
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function EmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Users size={30} />
      </div>
      <h3 className="text-base font-semibold text-slate-700">
        {hasFilter ? 'Nenhum resultado' : 'Sem clientes ainda'}
      </h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        {hasFilter
          ? 'Tente outra busca.'
          : 'Qualifique contatos da aba Triagem como “cliente” para vê-los aqui.'}
      </p>
      {hasFilter && (
        <button
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
        >
          <RefreshCw size={14} />
          Limpar busca
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-base font-semibold text-red-900">
        Não foi possível carregar os clientes
      </h3>
      <p className="text-sm text-red-700 mt-1.5 font-mono break-words max-w-xl mx-auto">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
      >
        <RefreshCw size={15} />
        Tentar novamente
      </button>
    </div>
  );
}
