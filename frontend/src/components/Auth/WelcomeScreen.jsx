// ==============================================================================
// VibeChat — Clean, Modern, Simple Chat & Calling App Auth Screen
// No clutter, no confusing marketing matter — just fast chat & calls
// ==============================================================================

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  Server,
  Wifi,
  X
} from 'lucide-react';
import { store } from '../../services/store';
import { getServerUrl, setCustomServerUrl, testServerConnection } from '../../services/api';

const AVATAR_LIST = ['🦊', '🌸', '⚡', '🚀', '🐼', '🌟'];

export default function WelcomeScreen({ onQuickLogin }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupAvatar, setSignupAvatar] = useState('🦊');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Server URL settings state
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl() || 'http://172.27.31.120:5000');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testServerConnection(serverUrlInput.trim());
      if (res.ok) {
        setTestResult({ success: true, message: `Connected successfully! Backend server responded (HTTP ${res.status}).` });
      } else {
        setTestResult({ success: false, message: `Cannot reach server: ${res.error}. Make sure phone and PC are on the same Wi-Fi and port 5000 is open.` });
      }
    } catch (err) {
      setTestResult({ success: false, message: `Connection error: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveServerUrl = () => {
    setCustomServerUrl(serverUrlInput.trim());
    window.location.reload();
  };

  const handleResetServerUrl = () => {
    setCustomServerUrl(null);
    window.location.reload();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter your mobile number or username and password.');
      return;
    }

    setLoginLoading(true);
    try {
      await store.logIn(loginIdentifier.trim(), loginPassword);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim() || !signupPassword) {
      setSignupError('Please provide your name and a password.');
      return;
    }

    const cleanPhone = signupPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone && !signupEmail.trim()) {
      setSignupError('Please enter your 10-digit mobile number.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    setSignupLoading(true);
    try {
      await store.signUp({
        name: signupName.trim(),
        phone: cleanPhone,
        email: signupEmail.trim() || (cleanPhone ? `${cleanPhone}@vibechat.io` : ''),
        password: signupPassword,
        avatar: signupAvatar
      });
    } catch (err) {
      setSignupError(err.message || 'Registration failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090D16] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden select-none">
      {/* Subtle modern background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-[#111726]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Clean Logo Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-600/30 mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            VibeChat
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <span>Simple, Fast Chatting & HD Calls</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </p>
        </div>

        {/* Tab Switcher: Sign In / Create Account */}
        <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
              setSignupError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setLoginError('');
              setSignupError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mobile Number or Username
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or anju"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: CREATE ACCOUNT FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3.5">
            {signupError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            {/* Choose Avatar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Choose Avatar
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_LIST.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSignupAvatar(av)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer ${
                      signupAvatar === av
                        ? 'bg-purple-600 scale-110 shadow-md ring-2 ring-purple-400'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Anjali"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="e.g. 9390064784 (10 digits)"
                  maxLength={12}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {signupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start Chatting</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Accounts (1-Click Test) */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center mb-3">
            ⚡ Quick Demo Accounts (1-Click Test)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onQuickLogin('usr_anju')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-slate-200 transition-all cursor-pointer flex items-center gap-2 group text-left"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🦊</span>
              <div className="truncate">
                <div className="text-xs font-bold text-white group-hover:text-purple-300 truncate">Anjali</div>
                <div className="text-[10px] text-slate-400 font-mono">9876543210</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onQuickLogin('usr_partner')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-slate-200 transition-all cursor-pointer flex items-center gap-2 group text-left"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">🌸</span>
              <div className="truncate">
                <div className="text-xs font-bold text-white group-hover:text-purple-300 truncate">Partner</div>
                <div className="text-[10px] text-slate-400 font-mono">9876543211</div>
              </div>
            </button>
          </div>
        </div>

        {/* Server Connection Status & Config Link */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="truncate">Server: {getServerUrl() || 'http://172.27.31.120:5000'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setServerUrlInput(getServerUrl() || 'http://172.27.31.120:5000');
              setTestResult(null);
              setShowServerModal(true);
            }}
            className="text-purple-400 hover:text-purple-300 font-medium underline cursor-pointer ml-2 flex-shrink-0"
          >
            Configure IP
          </button>
        </div>

      </div>

      {/* Server URL Configuration Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111726] border border-white/10 rounded-2xl p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowServerModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Backend Server URL</h3>
                <p className="text-[11px] text-slate-400">Configure PC Wi-Fi IP for Mobile App</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Server Address (IP:Port or Render URL)
                </label>
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => setServerUrlInput(e.target.value)}
                  placeholder="e.g. http://172.27.31.120:5000"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                  <span>Ping Server</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveServerUrl}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Save & Reload
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetServerUrl}
                className="w-full py-1 text-[11px] text-slate-400 hover:text-slate-300 underline cursor-pointer text-center"
              >
                Reset to Default (172.27.31.120:5000)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
