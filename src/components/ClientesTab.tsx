import { useEffect, useMemo, useState } from 'react';
import {
  cleanWhatsAppNumber,
  fetchClientes,
  FUNIL_OPTIONS,
  TIPO_OPTIONS,
  updateContato,
  whatsappLink,
  type Contato,
  type ContatoTipo,
  type ContatoUpdate,
  type FunilEtapa,
} from '@/lib/supabase';
import {
  AlertTriangle,
  Check,
  Filter,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { TipoBadge } from './TipoBadge';
import { FunilBadge } from './FunilBadge';
import { InlineNameEditor } from './InlineNameEditor';

export function ClientesTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bairroFilter, setBairroFilter] = useState<string>('');
  const [funilFilter, setFunilFilter] = useState<string>('');
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

  const bairros = useMemo(() => {
    const set = new Set<string>();
    contatos.forEach((c) => {
      if (c.bairro && c.bairro.trim()) set.add(c.bairro.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [contatos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contatos.filter((c) => {
      if (bairroFilter && (c.bairro ?? '').trim() !== bairroFilter) return false;
      if (funilFilter && (c.funil_etapa ?? '') !== funilFilter) return false;
      if (!q) return true;
      const nome = (c.nome ?? '').toLowerCase();
      const num = cleanWhatsAppNumber(c.numero).toLowerCase();
      const desc = (c.descricao ?? '').toLowerCase();
      return nome.includes(q) || num.includes(q) || desc.includes(q);
    });
  }, [contatos, query, bairroFilter, funilFilter]);

  const hasActiveFilter = bairroFilter !== '' || funilFilter !== '' || query.trim() !== '';

  const clearFilters = () => {
    setQuery('');
    setBairroFilter('');
    setFunilFilter('');
  };

  const handleUpdate = async (id: number, patch: ContatoUpdate) => {
    try {
      await updateContato(id, patch);
      setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    } catch (err) {
      console.error('[ClientesTab] erro ao atualizar contato:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setError(msg);
    }
  };

  const handleNameSave = async (id: number, nome: string | null) => {
    await handleUpdate(id, { nome });
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
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

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Filter size={14} />
        </div>
        <select
          value={bairroFilter}
          onChange={(e) => setBairroFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white"
        >
          <option value="">Todos os bairros</option>
          {bairros.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={funilFilter}
          onChange={(e) => setFunilFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white"
        >
          <option value="">Todas as etapas</option>
          {FUNIL_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X size={14} />
            Limpar filtros
          </button>
        )}
        {filtered.length !== contatos.length && (
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} de {contatos.length}
          </span>
        )}
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={hasActiveFilter} onClear={clearFilters} />
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
              onNameSave={(nome) => handleNameSave(c.id, nome)}
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
  onNameSave,
}: {
  contato: Contato;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: ContatoUpdate) => void;
  onNameSave: (nome: string | null) => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);
  const [desc, setDesc] = useState(contato.descricao ?? '');
  const [tipo, setTipo] = useState<ContatoTipo>(contato.tipo);
  const [produto, setProduto] = useState(contato.produto_interesse ?? '');
  const [bairro, setBairro] = useState(contato.bairro ?? '');
  const [funil, setFunil] = useState<FunilEtapa>(contato.funil_etapa ?? 'Novo');

  useEffect(() => {
    setDesc(contato.descricao ?? '');
    setTipo(contato.tipo);
    setProduto(contato.produto_interesse ?? '');
    setBairro(contato.bairro ?? '');
    setFunil(contato.funil_etapa ?? 'Novo');
  }, [contato]);

  const save = () => {
    const patch: ContatoUpdate = {};
    if (desc.trim() !== (contato.descricao ?? '').trim()) patch.descricao = desc.trim() || null;
    if (tipo !== contato.tipo) patch.tipo = tipo;
    if (produto.trim() !== (contato.produto_interesse ?? '').trim())
      patch.produto_interesse = produto.trim() || null;
    if (bairro.trim() !== (contato.bairro ?? '').trim())
      patch.bairro = bairro.trim() || null;
    if (funil !== (contato.funil_etapa ?? 'Novo')) patch.funil_etapa = funil;
    onSave(patch);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <InlineNameEditor nome={contato.nome} onSave={onNameSave} />
            <TipoBadge tipo={contato.tipo} />
          </div>
          <p className="text-sm text-slate-500 font-mono truncate">{clean || '—'}</p>
          {!editing && contato.funil_etapa && (
            <div className="mt-1.5">
              <FunilBadge etapa={contato.funil_etapa} />
            </div>
          )}
        </div>
      </div>

      {!editing && (
        <div className="mt-3 space-y-1">
          {contato.produto_interesse && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-400">Interesse:</span> {contato.produto_interesse}
            </p>
          )}
          {contato.bairro && (
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              {contato.bairro}
            </p>
          )}
          {contato.descricao ? (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-100 whitespace-pre-wrap">
              {contato.descricao}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Sem descrição.</p>
          )}
        </div>
      )}

      {editing ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Etapa do funil
              </label>
              <select
                value={funil}
                onChange={(e) => setFunil(e.target.value as FunilEtapa)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white"
              >
                {FUNIL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Produto de interesse
              </label>
              <input
                type="text"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                placeholder="Ex.: Tênis masculino"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Bairro
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                placeholder="Ex.: Centro"
              />
            </div>
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
      )}
    </article>
  );
}

function EmptyState({
  hasFilter,
  onClear,
}: {
  hasFilter: boolean;
  onClear: () => void;
}) {
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
          ? 'Tente outra busca ou ajuste os filtros.'
          : 'Qualifique contatos da aba Triagem como “cliente” para vê-los aqui.'}
      </p>
      {hasFilter && (
        <button
          onClick={onClear}
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
        >
          <RefreshCw size={14} />
          Limpar filtros
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
