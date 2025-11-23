import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, ArrowRight, Loader2, AlertCircle, User as UserIcon, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import { User } from '../types';
import { loginUser, requestRegistration, verifyAndRegister } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

type AuthView = 'LOGIN' | 'REGISTER_DETAILS' | 'REGISTER_VERIFY';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setError('');
    setEmail('');
    setUsername('');
    setPassword('');
    setVerificationCode('');
    setIsLoading(false);
    setView('LOGIN');
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Introduce correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(email, password);
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !username || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      await requestRegistration(username, email, password);
      setView('REGISTER_VERIFY');
      setError(''); // Clear errors if successful
    } catch (err: any) {
      setError(err.message || 'Error al solicitar registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await verifyAndRegister(email, verificationCode);
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setError('');
    setView(newView);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="bg-[#151621] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-slide-up border border-white/10 ring-1 ring-white/5">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20 p-2 hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>

        {view === 'REGISTER_VERIFY' && (
           <button 
             onClick={() => setView('REGISTER_DETAILS')}
             className="absolute top-4 left-4 text-gray-500 hover:text-white transition-colors z-20 p-2 hover:bg-white/10 rounded-full flex items-center gap-1 text-sm"
           >
             <ChevronLeft size={20} /> Atrás
           </button>
        )}

        <div className="p-8 md:p-10 relative">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-wide">
              {view === 'LOGIN' && 'Bienvenido de nuevo'}
              {view === 'REGISTER_DETAILS' && 'Únete a AniStream'}
              {view === 'REGISTER_VERIFY' && 'Verifica tu Correo'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
              {view === 'LOGIN' && 'Accede a tu cuenta para continuar tu maratón de anime.'}
              {view === 'REGISTER_DETAILS' && 'Crea tu cuenta gratuita y sincroniza tus dispositivos.'}
              {view === 'REGISTER_VERIFY' && (
                <span>
                  Hemos enviado un código a <span className="text-white font-bold">{email}</span>. 
                  <br/> <span className="text-xs text-yellow-500/80">(Revisa la consola del navegador F12)</span>
                </span>
              )}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 text-red-400 text-sm animate-pulse">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'LOGIN' && (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-500 group-focus-within:text-anime-primary transition-colors" size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-anime-primary focus:ring-1 focus:ring-anime-primary focus:outline-none transition-all shadow-inner"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-500 group-focus-within:text-anime-primary transition-colors" size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-anime-primary focus:ring-1 focus:ring-anime-primary focus:outline-none transition-all shadow-inner"
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" className="text-xs text-gray-500 hover:text-anime-primary transition-colors font-medium">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-anime-primary hover:bg-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-neon hover:shadow-[0_0_20px_rgba(255,61,113,0.6)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Acceder'}
              </button>
            </form>
          )}

          {/* VIEW: REGISTER DETAILS */}
          {view === 'REGISTER_DETAILS' && (
            <form className="space-y-5" onSubmit={handleRegisterDetails}>
               <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="text-gray-500 group-focus-within:text-anime-primary transition-colors" size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="OtakuMaster99"
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-anime-primary focus:ring-1 focus:ring-anime-primary focus:outline-none transition-all shadow-inner"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-500 group-focus-within:text-anime-primary transition-colors" size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-anime-primary focus:ring-1 focus:ring-anime-primary focus:outline-none transition-all shadow-inner"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-500 group-focus-within:text-anime-primary transition-colors" size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0b0c15] border border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-anime-primary focus:ring-1 focus:ring-anime-primary focus:outline-none transition-all shadow-inner"
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-right mt-1">Mínimo 6 caracteres</p>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-anime-primary hover:bg-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-neon hover:shadow-[0_0_20px_rgba(255,61,113,0.6)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Continuar <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* VIEW: REGISTER VERIFY */}
          {view === 'REGISTER_VERIFY' && (
             <form className="space-y-6" onSubmit={handleVerifyCode}>
                <div className="flex justify-center mb-4">
                    <ShieldCheck size={48} className="text-anime-primary animate-pulse" />
                </div>
                
                <div className="space-y-2 text-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Introduce el Código (6 dígitos)</label>
                    <input 
                        type="text" 
                        value={verificationCode}
                        onChange={(e) => {
                            // Only allow numbers and max 6 chars
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setVerificationCode(val);
                        }}
                        placeholder="000000"
                        className="w-full text-center bg-[#0b0c15] border-2 border-anime-primary/50 rounded-2xl py-4 text-3xl font-mono text-white tracking-[0.5em] focus:border-anime-primary focus:ring-0 focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                        autoComplete="one-time-code"
                        autoFocus
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Verificar y Entrar <CheckCircle2 size={18} /></>}
                </button>
             </form>
          )}

          {/* Footer Switching */}
          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-gray-400 text-sm">
              {view === 'LOGIN' ? '¿Nuevo en AniStream?' : '¿Ya tienes una cuenta?'}
              <button 
                onClick={() => switchView(view === 'LOGIN' ? 'REGISTER_DETAILS' : 'LOGIN')}
                className="text-white font-bold ml-2 hover:text-anime-primary transition-colors underline decoration-anime-primary/30 underline-offset-4 decoration-2 hover:decoration-anime-primary"
              >
                {view === 'LOGIN' ? 'Crear cuenta gratis' : 'Inicia sesión aquí'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;