import { AlertTriangle, KeyRound } from 'lucide-react';

export function ConfigErrorBanner() {
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-amber-900">
              Configuração do Supabase necessária
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">
              As variáveis de ambiente do Supabase não foram encontradas ou estão
              vazias. Para que o aplicativo funcione, crie um arquivo{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-amber-900">
                .env
              </code>{' '}
              na raiz do projeto com as seguintes variáveis:
            </p>
            <pre className="text-xs bg-amber-900/90 text-amber-50 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui`}
            </pre>
            <div className="flex items-center gap-2 text-xs text-amber-700 pt-1">
              <KeyRound size={14} />
              <span>
                Reinicie o servidor de desenvolvimento após salvar o arquivo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
