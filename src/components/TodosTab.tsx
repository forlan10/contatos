import { useEffect, useMemo, useState } from 'react';
import {
  cleanWhatsAppNumber,
  fetchAllContatos,
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
  Contact as ContactIcon,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { TipoBadge } from './TipoBadge';
import { FunilBadge } from './FunilBadge';

export function TodosTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [funilFilter, setFunilFilter] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllContatos();
      setContatos(data);
    } catch (err) {
      console.error('[TodosTab] erro ao buscar contatos:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar contatos';
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
    return contatos.filter((c) => {
      if (tipoFilter && c.tipo !== tipoFilter) return false;
      if (funilFilter && (c.funil_etapa ?? '') !== funilFilter) return false;
      if (!q) return true;
      const nome = (c.nome ?? '').toLowerCase();
      const num = cleanWhatsAppNumber(c.numero).toLowerCase();
      const desc = (c.descricao ?? '').toLowerCase();
      const bairro = (c.bairro ?? '').toLowerCase();
      return (
        nome.includes(q) || num.includes(q) || desc.includes(q) || bairro.includes(q)
      );
    });
  }, [contatos, query, tipoFilter, funilFilter]);

  const hasActiveFilter =
    tipoFilter !== '' || funilFilter !== '' || query.trim() !== '';
  const clearFilters = () => {
    setQuery('');
    setTipoFilter('');
    setFunilFilter('');
  };

  const handleUpdate = async (id: number, patch: ContatoUpdate) => {
    try {
      await updateContato(id, patch);
      setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    } catch (err) {
      console.error('[TodosTab] erro ao atualizar contato:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setError(msg);
      throw err;
    }
  };

  const detailContato = detailId !== null ? contatos.find((c) => c.id === detailId) ?? null : null;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-800">Todos os contatos</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">
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
            placeholder="Buscar por nome, número, bairro ou nota"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors bg-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white"
        >
          <option value="">Todos os tipos</option>
          {TIPO_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
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
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Nome</th>
                  <th className="text-left font-medium px-4 py-3">WhatsApp</th>
                  <th className="text-left font-medium px-4 py-3">Tipo</th>
                  <th className="text-left font-medium px-4 py-3">Funil</th>
                  <th className="text-left font-medium px-4 py-3">Bairro</th>
                  <th className="text-right font-medium px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    contato={c}
                    onOpen={() => setDetailId(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-3">
            {filtered.map((c) => (
              <RowCard key={c.id} contato={c} onOpen={() => setDetailId(c.id)} />
            ))}
          </div>
        </>
      )}

      {detailContato && (
        <DetailModal
          contato={detailContato}
          onClose={() => setDetailId(null)}
          onSave={handleUpdate}
        />
      )}
    </section>
  );
}

function TableRow({
  contato,
  onOpen,
}: {
  contato: Contato;
  onOpen: () => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);
  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
          <span className="font-medium text-slate-900 truncate">
            {contato.nome || 'Sem nome'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
        {clean || '—'}
      </td>
      <td className="px-4 py-3">
        <TipoBadge tipo={contato.tipo} />
      </td>
      <td className="px-4 py-3">
        {contato.funil_etapa ? <FunilBadge etapa={contato.funil_etapa} /> : '—'}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {contato.bairro ? (
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-slate-400" />
            {contato.bairro}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        {clean ? (
          <a
            href={whatsappLink(contato.numero)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
            title="Abrir no WhatsApp"
          >
            <Phone size={16} />
          </a>
        ) : null}
      </td>
    </tr>
  );
}

function RowCard({
  contato,
  onOpen,
}: {
  contato: Contato;
  onOpen: () => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);
  return (
    <article
      onClick={onOpen}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {contato.nome || 'Sem nome'}
          </h3>
          <p className="text-sm text-slate-500 font-mono truncate">{clean || '—'}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <TipoBadge tipo={contato.tipo} />
            {contato.funil_etapa && <FunilBadge etapa={contato.funil_etapa} />}
            {contato.bairro && (
              <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                <MapPin size={12} />
                {contato.bairro}
              </span>
            )}
          </div>
        </div>
        {clean && (
          <a
            href={whatsappLink(contato.numero)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Abrir no WhatsApp"
          >
            <Phone size={16} />
          </a>
        )}
      </div>
    </article>
  );
}

function DetailModal({
  contato,
  onClose,
  onSave,
}: {
  contato: Contato;
  onClose: () => void;
  onSave: (id: number, patch: ContatoUpdate) => Promise<void>;
}) {
  const [nome, setNome] = useState(contato.nome ?? '');
  const [tipo, setTipo] = useState<ContatoTipo>(contato.tipo);
  const [produto, setProduto] = useState(contato.produto_interesse ?? '');
  const [bairro, setBairro] = useState(contato.bairro ?? '');
  const [descricao, setDescricao] = useState(contato.descricao ?? '');
  const [funil, setFunil] = useState<FunilEtapa>(contato.funil_etapa ?? 'Novo');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const submit = async () => {
    const patch: ContatoUpdate = {
      nome: nome.trim() || null,
      tipo,
      produto_interesse: produto.trim() || null,
      bairro: bairro.trim() || null,
      descricao: descricao.trim() || null,
      funil_etapa: funil,
    };
    setSaving(true);
    setError(null);
    try {
      await onSave(contato.id, patch);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const clean = cleanWhatsAppNumber(contato.numero);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-[modalIn_.18s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate">
                {contato.nome || 'Sem nome'}
              </h3>
              <p className="text-xs text-slate-500 font-mono truncate">{clean || '—'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {clean && (
            <a
              href={whatsappLink(contato.numero)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Phone size={16} />
              Abrir conversa no WhatsApp
            </a>
          )}

          <Field label="Nome do contato">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: João Silva"
              className={inputCls}
            />
          </Field>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo / categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIPO_OPTIONS.map((opt) => {
                const active = opt === tipo;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTipo(opt)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Etapa do funil">
            <select
              value={funil}
              onChange={(e) => setFunil(e.target.value as FunilEtapa)}
              className={inputCls}
            >
              {FUNIL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Produto de interesse">
            <input
              type="text"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Ex.: Tênis masculino, curso de inglês…"
              className={inputCls}
            />
          </Field>

          <Field label="Localização / Bairro">
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex.: Centro, Niterói…"
              className={inputCls}
            />
          </Field>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrição / observações
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Notas adicionais sobre o contato…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-y"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm shadow-emerald-600/20"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {children}
    </div>
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
        <ContactIcon size={30} />
      </div>
      <h3 className="text-base font-semibold text-slate-700">
        {hasFilter ? 'Nenhum resultado' : 'Sem contatos'}
      </h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        {hasFilter
          ? 'Tente outra busca ou ajuste os filtros.'
          : 'Nenhum contato encontrado na tabela contatos_WAPP.'}
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
        Não foi possível carregar os contatos
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
