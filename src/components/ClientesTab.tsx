import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cleanWhatsAppNumber,
  createFunilEtapa,
  deleteFunilEtapa,
  fetchClientes,
  fetchFunilEtapas,
  TIPO_OPTIONS,
  updateContato,
  updateFunilEtapa,
  whatsappLink,
  type Contato,
  type ContatoTipo,
  type ContatoUpdate,
  type FunilEtapa,
} from '@/lib/supabase';
import {
  AlertTriangle,
  Check,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { TipoBadge } from './TipoBadge';
import { FunilBadge } from './FunilBadge';
import { InlineNameEditor } from './InlineNameEditor';

const COLUMN_ACCENT: Record<string, string> = {
  Novo: 'bg-sky-500',
  'Em Negociacao': 'bg-amber-500',
  'Venda Fechada': 'bg-emerald-500',
  Perdido: 'bg-slate-400',
};

const ACCENT_PALETTE = [
  'bg-sky-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-slate-400',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-fuchsia-500',
];

const FALLBACK_ETAPAS: FunilEtapa[] = [
  { id: -1, nome: 'Novo', ordem: 1 },
  { id: -2, nome: 'Em Negociacao', ordem: 2 },
  { id: -3, nome: 'Venda Fechada', ordem: 3 },
  { id: -4, nome: 'Perdido', ordem: 4 },
];

export function ClientesTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [etapas, setEtapas] = useState<FunilEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [managingEtapas, setManagingEtapas] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientesData, etapasData] = await Promise.all([
        fetchClientes(),
        fetchFunilEtapas(),
      ]);
      setContatos(clientesData);
      setEtapas(etapasData.length > 0 ? etapasData : FALLBACK_ETAPAS);
    } catch (err) {
      console.error('[ClientesTab] erro ao buscar dados:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(msg);
      setEtapas((prev) => (prev.length > 0 ? prev : FALLBACK_ETAPAS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contatos;
    return contatos.filter((c) => {
      const nome = (c.nome ?? '').toLowerCase();
      const num = cleanWhatsAppNumber(c.numero).toLowerCase();
      const desc = (c.descricao ?? '').toLowerCase();
      const bairro = (c.bairro ?? '').toLowerCase();
      return (
        nome.includes(q) || num.includes(q) || desc.includes(q) || bairro.includes(q)
      );
    });
  }, [contatos, query]);

  const byEtapa = useMemo(() => {
    const map = new Map<string, Contato[]>();
    etapas.forEach((e) => map.set(e.nome, []));
    filtered.forEach((c) => {
      const etapa = c.funil_etapa ?? etapas[0]?.nome;
      if (!etapa) return;
      if (!map.has(etapa)) map.set(etapa, []);
      map.get(etapa)!.push(c);
    });
    return map;
  }, [filtered, etapas]);

  const handleUpdate = async (id: number, patch: ContatoUpdate) => {
    try {
      await updateContato(id, patch);
      setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    } catch (err) {
      console.error('[ClientesTab] erro ao atualizar contato:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setError(msg);
      throw err;
    }
  };

  const handleNameSave = async (id: number, nome: string | null) => {
    try {
      await updateContato(id, { nome });
      setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, nome } : c)));
    } catch (err) {
      console.error('[ClientesTab] erro ao atualizar nome:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar nome';
      setError(msg);
    }
  };

  const moveCard = async (id: number, etapa: string) => {
    const contato = contatos.find((c) => c.id === id);
    if (!contato || (contato.funil_etapa ?? '') === etapa) return;
    const prevEtapa = contato.funil_etapa;
    setContatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, funil_etapa: etapa } : c))
    );
    try {
      await updateContato(id, { funil_etapa: etapa });
    } catch (err) {
      console.error('[ClientesTab] erro ao mover cliente de etapa:', err);
      setContatos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, funil_etapa: prevEtapa } : c))
      );
      const msg = err instanceof Error ? err.message : 'Erro ao mover cliente de etapa';
      setError(msg);
    }
  };

  const detailContato =
    editingId !== null ? contatos.find((c) => c.id === editingId) ?? null : null;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-800">Esteira de clientes</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {contatos.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setManagingEtapas(true)}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            title="Gerenciar etapas do funil"
          >
            <Settings2 size={15} />
            Etapas
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Atualizar"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filtered.length === 0 && contatos.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="grid gap-4 items-start"
          style={{
            gridTemplateColumns: `repeat(${Math.min(etapas.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {etapas.map((etapa, idx) => {
            const lista = byEtapa.get(etapa.nome) ?? [];
            const accent = COLUMN_ACCENT[etapa.nome] ?? ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
            return (
              <div
                key={etapa.id}
                onDragOver={(e) => {
                  if (draggingId !== null) {
                    e.preventDefault();
                    setDropTarget(etapa.nome);
                  }
                }}
                onDragLeave={() => setDropTarget((t) => (t === etapa.nome ? null : t))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropTarget(null);
                  if (draggingId !== null) {
                    moveCard(draggingId, etapa.nome);
                    setDraggingId(null);
                  }
                }}
                className={`rounded-xl border bg-slate-100/60 flex flex-col transition-colors ${
                  dropTarget === etapa.nome
                    ? 'border-emerald-400 bg-emerald-50/60'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${accent}`} />
                  <h3 className="text-sm font-semibold text-slate-700 truncate">
                    {etapa.nome}
                  </h3>
                  <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold">
                    {lista.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)] overflow-y-auto">
                  {lista.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Arraste um cliente para cá
                    </p>
                  ) : (
                    lista.map((c) => (
                      <PipelineCard
                        key={c.id}
                        contato={c}
                        dragging={draggingId === c.id}
                        onDragStart={() => setDraggingId(c.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropTarget(null);
                        }}
                        onEdit={() => setEditingId(c.id)}
                        onNameSave={(nome) => handleNameSave(c.id, nome)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailContato && (
        <DetailModal
          contato={detailContato}
          etapas={etapas}
          onClose={() => setEditingId(null)}
          onSave={handleUpdate}
        />
      )}

      {managingEtapas && (
        <ManageEtapasModal
          etapas={etapas}
          onClose={() => setManagingEtapas(false)}
          onChanged={load}
        />
      )}
    </section>
  );
}

function ManageEtapasModal({
  etapas,
  onClose,
  onChanged,
}: {
  etapas: FunilEtapa[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [novoNome, setNovoNome] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addEtapa = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    setError(null);
    try {
      const maxOrdem = etapas.reduce((max, e) => Math.max(max, e.ordem), 0);
      await createFunilEtapa(nome, maxOrdem + 1);
      setNovoNome('');
      onChanged();
    } catch (err) {
      console.error('[ManageEtapas] erro ao criar etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar etapa');
    }
  };

  const renameEtapa = async (etapa: FunilEtapa) => {
    const nome = editNome.trim();
    if (!nome || nome === etapa.nome) {
      setEditandoId(null);
      return;
    }
    setBusyId(etapa.id);
    setError(null);
    try {
      await updateFunilEtapa(etapa.id, { nome });
      onChanged();
      setEditandoId(null);
    } catch (err) {
      console.error('[ManageEtapas] erro ao renomear etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao renomear etapa');
    } finally {
      setBusyId(null);
    }
  };

  const removeEtapa = async (etapa: FunilEtapa) => {
    const clientesNaEtapa = etapas.length;
    if (etapas.length <= 1) {
      setError('Você precisa ter pelo menos uma etapa.');
      return;
    }
    const confirmed = window.confirm(
      `Remover a etapa "${etapa.nome}"? Os clientes desta etapa ficarão sem etapa definida e aparecerão na primeira coluna.`
    );
    if (!confirmed) return;
    setBusyId(etapa.id);
    setError(null);
    try {
      await deleteFunilEtapa(etapa.id);
      onChanged();
    } catch (err) {
      console.error('[ManageEtapas] erro ao remover etapa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover etapa');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-[modalIn_.18s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Etapas do funil</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adicione, renomeie ou remova as colunas da esteira
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addEtapa();
              }}
              placeholder="Nome da nova etapa"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
            <button
              onClick={addEtapa}
              disabled={!novoNome.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={15} />
              Adicionar
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {etapas.map((etapa, idx) => (
              <li key={etapa.id} className="flex items-center gap-2 px-3 py-2.5 bg-white">
                <span className="text-xs text-slate-400 w-5">{idx + 1}.</span>
                {editandoId === etapa.id ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameEtapa(etapa);
                        if (e.key === 'Escape') setEditandoId(null);
                      }}
                      className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                    />
                    <button
                      onClick={() => renameEtapa(etapa)}
                      disabled={busyId === etapa.id}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      title="Salvar"
                    >
                      {busyId === etapa.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"
                      title="Cancelar"
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                      {etapa.nome}
                    </span>
                    <button
                      onClick={() => {
                        setEditandoId(etapa.id);
                        setEditNome(etapa.nome);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Renomear"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => removeEtapa(etapa)}
                      disabled={busyId === etapa.id || etapas.length <= 1}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                      title={
                        etapas.length <= 1
                          ? 'Precisa ter pelo menos uma etapa'
                          : 'Remover etapa'
                      }
                    >
                      {busyId === etapa.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-400">
            Ao remover uma etapa, os clientes dela ficam sem etapa e aparecem na
            primeira coluna. Nenhum cliente é apagado.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({
  contato,
  dragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onNameSave,
}: {
  contato: Contato;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onNameSave: (nome: string | null) => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all ${
        dragging ? 'opacity-40' : ''
      }`}
      title="Clique para editar · arraste para mudar de etapa"
    >
      <div className="flex items-start gap-2.5">
        <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <InlineNameEditor nome={contato.nome} onSave={onNameSave} />
          <p className="text-xs text-slate-500 font-mono truncate">{clean || '—'}</p>
        </div>
        <TipoBadge tipo={contato.tipo} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {contato.bairro && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={11} className="text-slate-400" />
            {contato.bairro}
          </span>
        )}
        {contato.produto_interesse && (
          <span className="truncate max-w-[10rem]">{contato.produto_interesse}</span>
        )}
      </div>

      {contato.descricao && (
        <p className="mt-2 text-xs text-slate-600 line-clamp-2 bg-slate-50 rounded-md px-2 py-1.5 border border-slate-100">
          {contato.descricao}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <FunilBadge etapa={contato.funil_etapa} />
        {clean && (
          <a
            href={whatsappLink(contato.numero)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Abrir no WhatsApp"
          >
            <Phone size={13} />
          </a>
        )}
      </div>
    </article>
  );
}

function DetailModal({
  contato,
  etapas,
  onClose,
  onSave,
}: {
  contato: Contato;
  etapas: FunilEtapa[];
  onClose: () => void;
  onSave: (id: number, patch: ContatoUpdate) => Promise<void>;
}) {
  const [nome, setNome] = useState(contato.nome ?? '');
  const [tipo, setTipo] = useState<ContatoTipo>(contato.tipo);
  const [produto, setProduto] = useState(contato.produto_interesse ?? '');
  const [bairro, setBairro] = useState(contato.bairro ?? '');
  const [descricao, setDescricao] = useState(contato.descricao ?? '');
  const [funil, setFunil] = useState<string>(
    contato.funil_etapa ?? etapas[0]?.nome ?? 'Novo'
  );
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
              onChange={(e) => setFunil(e.target.value)}
              className={inputCls}
            >
              {etapas.map((opt) => (
                <option key={opt.id} value={opt.nome}>
                  {opt.nome}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Users size={30} />
      </div>
      <h3 className="text-base font-semibold text-slate-700">Sem clientes ainda</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        Qualifique contatos da aba Triagem como “cliente” para vê-los aqui.
      </p>
    </div>
  );
}
