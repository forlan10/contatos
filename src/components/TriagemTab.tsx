import { useEffect, useMemo, useState } from 'react';
import {
  cleanWhatsAppNumber,
  fetchTriagem,
  updateContato,
  type Contato,
  type ContatoTipo,
  type ContatoUpdate,
  TIPO_OPTIONS,
} from '@/lib/supabase';
import {
  AlertTriangle,
  Clock,
  Inbox,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  X,
} from 'lucide-react';
import { ContactAvatar } from './ContactAvatar';
import { TipoBadge } from './TipoBadge';
import { QualifyModal } from './QualifyModal';
import { InlineNameEditor } from './InlineNameEditor';

export function TriagemTab() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualifying, setQualifying] = useState<Contato | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTriagem();
      setContatos(data);
    } catch (err) {
      console.error('[TriagemTab] erro ao buscar contatos:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao carregar contatos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = useMemo(() => contatos.length, [contatos]);

  const handleSaveQualify = async (id: number, patch: ContatoUpdate) => {
    try {
      await updateContato(id, patch);
      const stillTriagem = patch.tipo === 'em analise' || !patch.tipo;
      setContatos((prev) =>
        stillTriagem
          ? prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
          : prev.filter((c) => c.id !== id)
      );
    } catch (err) {
      console.error('[TriagemTab] erro ao qualificar contato:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao qualificar contato';
      setError(msg);
      throw err;
    }
  };

  const handleNameSave = async (id: number, novoNome: string | null) => {
    try {
      await updateContato(id, { nome: novoNome });
      setContatos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, nome: novoNome } : c))
      );
    } catch (err) {
      console.error('[TriagemTab] erro ao atualizar nome:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar nome';
      setError(msg);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-slate-800">Contatos em análise</h2>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
            {pending}
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Atualizar
        </button>
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : contatos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contatos.map((c) => (
            <TriagemCard
              key={c.id}
              contato={c}
              onQualify={() => setQualifying(c)}
              onNameSave={(nome) => handleNameSave(c.id, nome)}
            />
          ))}
        </div>
      )}

      {qualifying && (
        <QualifyModal
          contato={qualifying}
          onClose={() => setQualifying(null)}
          onSave={handleSaveQualify}
        />
      )}
    </section>
  );
}

function TriagemCard({
  contato,
  onQualify,
  onNameSave,
}: {
  contato: Contato;
  onQualify: () => void;
  onNameSave: (nome: string | null) => void;
}) {
  const clean = cleanWhatsAppNumber(contato.numero);
  const created = new Date(contato.created_at);

  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start gap-3">
        <ContactAvatar nome={contato.nome} tipo={contato.tipo} />
        <div className="flex-1 min-w-0">
          <InlineNameEditor nome={contato.nome} onSave={onNameSave} />
          <p className="text-sm text-slate-500 font-mono truncate">{clean || '—'}</p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
            <Clock size={12} />
            <time>
              {created.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </div>
        </div>
        <TipoBadge tipo={contato.tipo} />
      </div>

      {contato.descricao && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2 bg-slate-50 rounded-md px-3 py-2 border border-slate-100">
          {contato.descricao}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onQualify}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm shadow-emerald-600/20"
        >
          <MessageCircle size={15} />
          Qualificar contato
        </button>
        {clean && (
          <a
            href={`https://wa.me/${clean}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Abrir no WhatsApp"
          >
            <Phone size={16} />
          </a>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Inbox size={30} />
      </div>
      <h3 className="text-base font-semibold text-slate-700">Sem novos contatos</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">
        Contatos marcados como <span className="font-medium">“em analise”</span> aparecerão
        aqui para você qualificá-los.
      </p>
    </div>
  );
}

export { TIPO_OPTIONS };

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
