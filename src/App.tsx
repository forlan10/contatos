import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { TriagemTab } from '@/components/TriagemTab';
import { ClientesTab } from '@/components/ClientesTab';
import { TodosTab } from '@/components/TodosTab';
import { FornecedoresTab } from '@/components/FornecedoresTab';
import { ConfigErrorBanner } from '@/components/ConfigErrorBanner';
import { Contact as ContactIcon, Inbox, Truck, Users } from 'lucide-react';

type Tab = 'triagem' | 'clientes' | 'todos' | 'fornecedores';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'triagem', label: 'Triagem / Entradas', icon: <Inbox size={16} /> },
  { id: 'clientes', label: 'Esteira de Clientes', icon: <Users size={16} /> },
  { id: 'todos', label: 'Todos os Contatos', icon: <ContactIcon size={16} /> },
  { id: 'fornecedores', label: 'Fornecedores', icon: <Truck size={16} /> },
];

const ORDER_KEY = 'wapp-tab-order';

function loadTabOrder(): Tab[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Tab[];
      const valid = parsed.filter((t) => TAB_CONFIG.some((c) => c.id === t));
      const missing = TAB_CONFIG.map((c) => c.id).filter((t) => !valid.includes(t));
      return [...valid, ...missing];
    }
  } catch {
    // ignore malformed stored order
  }
  return TAB_CONFIG.map((c) => c.id);
}

function App() {
  const [tab, setTab] = useState<Tab>('triagem');
  const [tabOrder, setTabOrder] = useState<Tab[]>(loadTabOrder);
  const [draggingTab, setDraggingTab] = useState<Tab | null>(null);
  const [novoCount, setNovoCount] = useState(0);
  const configured = isSupabaseConfigured;

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(tabOrder));
    } catch {
      // storage unavailable
    }
  }, [tabOrder]);

  const fetchNovoCount = useCallback(async () => {
    if (!supabase) return;
    const { count, error } = await supabase
      .from('contatos_WAPP')
      .select('id', { count: 'exact', head: true })
      .eq('novo', true);
    if (error) {
      console.error('[App] erro ao contar contatos novos:', error);
      return;
    }
    setNovoCount(count ?? 0);
  }, []);

  useEffect(() => {
    fetchNovoCount();
  }, [fetchNovoCount, tab]);

  const moveTab = (from: Tab, to: Tab) => {
    if (from === to) return;
    setTabOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <Inbox size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Contatos WAPP</h1>
              <p className="text-xs text-slate-500 leading-tight">
                Gestão de contatos do WhatsApp
              </p>
            </div>
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabOrder.map((tabId) => {
              const cfg = TAB_CONFIG.find((c) => c.id === tabId)!;
              return (
                <TabButton
                  key={tabId}
                  active={tab === tabId}
                  onClick={() => setTab(tabId)}
                  icon={cfg.icon}
                  label={cfg.label}
                  badge={tabId === 'triagem' && novoCount > 0 ? novoCount : undefined}
                  draggable
                  onDragStart={() => setDraggingTab(tabId)}
                  onDragEnd={() => setDraggingTab(null)}
                  onDragOver={(e) => {
                    if (draggingTab && draggingTab !== tabId) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingTab) moveTab(draggingTab, tabId);
                  }}
                  dragging={draggingTab === tabId}
                />
              );
            })}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!configured ? (
          <ConfigErrorBanner />
        ) : tab === 'triagem' ? (
          <TriagemTab />
        ) : tab === 'clientes' ? (
          <ClientesTab />
        ) : tab === 'fornecedores' ? (
          <FornecedoresTab />
        ) : (
          <TodosTab />
        )}
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  draggable,
  dragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={draggable ? 'Arraste para reordenar as abas' : undefined}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px select-none ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      } ${dragging ? 'opacity-40' : ''}`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-sky-500 text-white text-[11px] font-semibold">
          {badge}
        </span>
      )}
    </button>
  );
}

export default App;
