import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TriagemTab } from '@/components/TriagemTab';
import { ClientesTab } from '@/components/ClientesTab';
import { TodosTab } from '@/components/TodosTab';
import { ConfigErrorBanner } from '@/components/ConfigErrorBanner';
import { Contact as ContactIcon, Inbox, Users } from 'lucide-react';

type Tab = 'triagem' | 'clientes' | 'todos';

function App() {
  const [tab, setTab] = useState<Tab>('triagem');
  const configured = isSupabaseConfigured;

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
            <TabButton
              active={tab === 'triagem'}
              onClick={() => setTab('triagem')}
              icon={<Inbox size={16} />}
              label="Triagem / Entradas"
            />
            <TabButton
              active={tab === 'clientes'}
              onClick={() => setTab('clientes')}
              icon={<Users size={16} />}
              label="Esteira de Clientes"
            />
            <TabButton
              active={tab === 'todos'}
              onClick={() => setTab('todos')}
              icon={<ContactIcon size={16} />}
              label="Todos os Contatos"
            />
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
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
