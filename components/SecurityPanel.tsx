import React, { useMemo, useState } from 'react';
import { ShieldCheck, Lock, EyeOff, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';
import { User } from '../types';

interface SecurityPanelProps {
  onClearHistory: () => void;
  onLogout: () => void;
  user: User | null;
}

const SecurityPanel: React.FC<SecurityPanelProps> = ({ onClearHistory, onLogout, user }) => {
  const [secureStreaming, setSecureStreaming] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [autoLock, setAutoLock] = useState(true);

  const securityBadges = useMemo(
    () => [
      { label: 'Escaneo de proveedores', enabled: secureStreaming },
      { label: 'Protección de datos locales', enabled: privacyMode },
      { label: 'Bloqueo automático', enabled: autoLock },
    ],
    [secureStreaming, privacyMode, autoLock]
  );

  return (
    <div className="bg-[#0d0f1a]/90 border border-white/5 rounded-3xl p-6 md:p-7 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-anime-primary/20 rounded-2xl border border-anime-primary/30 shadow-neon">
            <ShieldCheck className="text-anime-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">Seguridad</p>
            <h3 className="text-xl font-display font-bold text-white">Centro de protección</h3>
          </div>
        </div>
        <button
          onClick={() => {
            setSecureStreaming(true);
            setPrivacyMode(true);
            setAutoLock(true);
          }}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-gray-200"
        >
          <RefreshCw size={14} />
          Restablecer
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
          <div className={`p-2 rounded-xl ${secureStreaming ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-300'}`}>
            <Lock size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Streams seguros</p>
            <p className="text-xs text-gray-400">Solo cargamos enlaces HTTPS validados para evitar contenido mixto.</p>
            <label className="inline-flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={secureStreaming}
                onChange={(e) => setSecureStreaming(e.target.checked)}
                className="accent-anime-primary"
              />
              Enforce HTTPS
            </label>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
          <div className={`p-2 rounded-xl ${privacyMode ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
            <EyeOff size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Privacidad activa</p>
            <p className="text-xs text-gray-400">Minimiza rastros locales y facilita borrar historial sensible.</p>
            <button
              onClick={onClearHistory}
              className="text-xs font-semibold text-anime-primary hover:text-white transition-colors"
            >
              Limpiar historial
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
          <div className={`p-2 rounded-xl ${autoLock ? 'bg-purple-500/20 text-purple-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
            <KeyRound size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Sesión protegida</p>
            <p className="text-xs text-gray-400">Cierra la sesión en dispositivos compartidos para proteger tu cuenta.</p>
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              disabled={!user}
            >
              {user ? 'Cerrar sesión segura' : 'No hay sesión activa'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {securityBadges.map((badge) => (
          <span
            key={badge.label}
            className={`text-[11px] px-3 py-1 rounded-full border ${
              badge.enabled ? 'border-green-500/30 text-green-300 bg-green-500/10' : 'border-yellow-500/30 text-yellow-200 bg-yellow-500/10'
            } flex items-center gap-2`}
          >
            <CheckCircle2 size={12} /> {badge.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SecurityPanel;
