'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

type Status = { estado: 'open' | 'close' | 'connecting' | 'nao_configurado' | 'erro' | string };
type QR     = { base64?: string; code?: string };

const ESTADO_INFO: Record<string, { label: string; cor: string; desc: string }> = {
  open:             { label: 'Conectado',       cor: 'text-teal-600',  desc: 'WhatsApp está online e enviando mensagens.' },
  connecting:       { label: 'Conectando…',     cor: 'text-amber-500', desc: 'Aguardando conexão. Escaneie o QR Code.' },
  close:            { label: 'Desconectado',    cor: 'text-red-500',   desc: 'Escaneie o QR Code para conectar.' },
  nao_configurado:  { label: 'Não configurado', cor: 'text-stone-400', desc: 'Configure as variáveis EVOLUTION_API_URL e EVOLUTION_API_KEY no Railway.' },
  erro:             { label: 'Erro',            cor: 'text-red-500',   desc: 'Não foi possível conectar à Evolution API.' },
};

export default function WhatsAppPage() {
  const [status,      setStatus]      = useState<Status | null>(null);
  const [qr,          setQr]          = useState<QR | null>(null);
  const [testeTel,    setTesteTel]    = useState('');
  const [testando,    setTestando]    = useState(false);
  const [testeMsg,    setTesteMsg]    = useState('');
  const [carregando,  setCarregando]  = useState(true);

  const buscarStatus = useCallback(async () => {
    try {
      const st = await api.get<Status>('/whatsapp/status');
      setStatus(st);
      if (st.estado !== 'open' && st.estado !== 'nao_configurado') {
        const qrData = await api.get<QR>('/whatsapp/qrcode').catch(() => null);
        setQr(qrData);
      } else {
        setQr(null);
      }
    } catch {
      setStatus({ estado: 'erro' });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarStatus();
    const iv = setInterval(buscarStatus, 15000); // poll a cada 15s
    return () => clearInterval(iv);
  }, [buscarStatus]);

  async function desconectar() {
    if (!confirm('Desconectar o WhatsApp?')) return;
    await api.delete('/whatsapp/desconectar');
    buscarStatus();
  }

  async function testar() {
    if (!testeTel) return;
    setTestando(true); setTesteMsg('');
    try {
      await api.post('/whatsapp/testar', { telefone: testeTel });
      setTesteMsg('✓ Mensagem enviada com sucesso!');
    } catch (err: unknown) {
      setTesteMsg(err instanceof Error ? `Erro: ${err.message}` : 'Erro ao enviar');
    } finally { setTestando(false); }
  }

  const info = status ? (ESTADO_INFO[status.estado] ?? { label: status.estado, cor: 'text-stone-500', desc: '' }) : null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-light italic text-stone-800 mb-1">WhatsApp</h1>
      <p className="text-stone-400 text-sm mb-8">Conecte um número para enviar confirmações e lembretes automáticos.</p>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Status da conexão</h2>
          <button onClick={buscarStatus} className="text-xs text-stone-400 hover:text-stone-600 transition">↻ Atualizar</button>
        </div>

        {carregando ? (
          <p className="text-stone-400 text-sm">Verificando…</p>
        ) : info && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl ${status?.estado === 'open' ? '' : 'opacity-40'}`}>
                {status?.estado === 'open' ? '🟢' : status?.estado === 'connecting' ? '🟡' : '🔴'}
              </span>
              <span className={`font-semibold text-sm ${info.cor}`}>{info.label}</span>
            </div>
            <p className="text-stone-400 text-sm">{info.desc}</p>
          </>
        )}

        {status?.estado === 'open' && (
          <button onClick={desconectar}
            className="mt-4 text-xs text-red-400 hover:text-red-600 transition">
            Desconectar número
          </button>
        )}
      </div>

      {/* QR Code */}
      {qr?.base64 && status?.estado !== 'open' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Escanear QR Code</h2>
          <p className="text-stone-500 text-sm mb-4">Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
          <img
            src={`data:image/png;base64,${qr.base64}`}
            alt="QR Code WhatsApp"
            className="mx-auto w-56 h-56 border border-stone-200 rounded-xl"
          />
          <p className="text-xs text-stone-400 mt-3">QR Code atualiza automaticamente a cada 15 segundos</p>
        </div>
      )}

      {/* Teste */}
      {status?.estado === 'open' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Enviar mensagem de teste</h2>
          <div className="flex gap-3">
            <input type="tel" value={testeTel} onChange={e => setTesteTel(e.target.value)}
              placeholder="(11) 99999-9999"
              className="flex-1 border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300" />
            <button onClick={testar} disabled={testando || !testeTel}
              className="bg-stone-800 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50">
              {testando ? 'Enviando…' : 'Testar'}
            </button>
          </div>
          {testeMsg && (
            <p className={`text-sm mt-3 ${testeMsg.startsWith('✓') ? 'text-teal-600' : 'text-red-500'}`}>{testeMsg}</p>
          )}
        </div>
      )}

      {/* Instruções de configuração */}
      {status?.estado === 'nao_configurado' && (
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Como configurar</h2>
          <ol className="space-y-3 text-sm text-stone-600 list-decimal list-inside">
            <li>
              No Railway, crie um novo serviço usando a imagem Docker:
              <code className="block bg-white border border-stone-200 rounded px-3 py-2 mt-1 text-xs font-mono">
                atendai/evolution-api:latest
              </code>
            </li>
            <li>Configure as variáveis de ambiente do novo serviço:
              <code className="block bg-white border border-stone-200 rounded px-3 py-2 mt-1 text-xs font-mono whitespace-pre">{`AUTHENTICATION_API_KEY=sua_chave_aqui\nAUTHENTICATION_TYPE=apikey`}</code>
            </li>
            <li>Copie a URL pública do serviço Evolution API</li>
            <li>No serviço do <strong>Anamines2</strong>, adicione as variáveis:
              <code className="block bg-white border border-stone-200 rounded px-3 py-2 mt-1 text-xs font-mono whitespace-pre">{`EVOLUTION_API_URL=https://sua-evolution.railway.app\nEVOLUTION_API_KEY=sua_chave_aqui\nEVOLUTION_INSTANCE=clinica`}</code>
            </li>
            <li>Faça redeploy e volte aqui para escanear o QR Code</li>
          </ol>
        </div>
      )}
    </div>
  );
}
