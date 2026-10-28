import { useEffect, useState } from 'react';
import {
  FUNIL_OPTIONS,
  TIPO_OPTIONS,
  type Contato,
  type ContatoTipo,
  type ContatoUpdate,
  type FunilEtapa,
} from '@/lib/supabase';
import { Check, Loader2, X } from 'lucide-react';

interface Props {
  contato: Contato;
  onClose: () => void;
  onSave: (id: number, patch: ContatoUpdate) => Promise<void>;
}

export function QualifyModal({ contato, onClose, onSave }: Props) {
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
      console.error('[QualifyModal] erro ao salvar contato:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-[modalIn_.18s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Qualificar contato</h3>
            <p className="text-xs text-slate-500 mt-0.5">{contato.nome || 'Sem nome'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
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
            <label
              htmlFor="qualify-desc"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Descrição / observações
            </label>
            <textarea
              id="qualify-desc"
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
