import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.length > 0 &&
  supabaseUrl.startsWith('http') &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0;

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl as string, supabaseAnonKey as string);
}

export const supabase = client;

export type ContatoTipo =
  | 'em analise'
  | 'cliente'
  | 'familia'
  | 'trabalho'
  | 'fornecedor'
  | 'ignorado';

export const TIPO_OPTIONS: ContatoTipo[] = [
  'em analise',
  'cliente',
  'familia',
  'trabalho',
  'fornecedor',
  'ignorado',
];

export type FunilEtapa = 'Novo' | 'Em Negociacao' | 'Venda Fechada' | 'Perdido';

export const FUNIL_OPTIONS: FunilEtapa[] = [
  'Novo',
  'Em Negociacao',
  'Venda Fechada',
  'Perdido',
];

export interface Contato {
  id: number;
  created_at: string;
  nome: string | null;
  numero: string | null;
  tipo: ContatoTipo;
  descricao: string | null;
  produto_interesse: string | null;
  bairro: string | null;
  funil_etapa: FunilEtapa | null;
}

export type ContatoUpdate = Partial<
  Pick<
    Contato,
    'nome' | 'numero' | 'tipo' | 'descricao' | 'produto_interesse' | 'bairro' | 'funil_etapa'
  >
>;

const TABLE_NAME = 'contatos_WAPP';

const SELECT_COLS =
  'id, created_at, nome, numero, tipo, descricao, produto_interesse, bairro, funil_etapa';

export async function fetchContatosByTipo(tipo: ContatoTipo): Promise<Contato[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SELECT_COLS)
    .eq('tipo', tipo)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Contato[];
}

export async function fetchClientes(): Promise<Contato[]> {
  return fetchContatosByTipo('cliente');
}

export async function fetchTriagem(): Promise<Contato[]> {
  return fetchContatosByTipo('em analise');
}

export async function updateContato(id: number, patch: ContatoUpdate): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase.from(TABLE_NAME).update(patch).eq('id', id);
  if (error) throw error;
}

export function cleanWhatsAppNumber(numero: string | null): string {
  if (!numero) return '';
  return numero.replace(/@s\.whatsapp\.net$/i, '').trim();
}

export function whatsappLink(numero: string | null): string {
  const clean = cleanWhatsAppNumber(numero);
  return `https://wa.me/${clean}`;
}
