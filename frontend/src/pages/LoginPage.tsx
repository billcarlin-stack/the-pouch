import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import hfcLogo from '../assets/hfc-logo.png';

// Google "G" Logo SVG
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
        </g>
    </svg>
);

const LoginPage = () => {
    const { loginWithGoogle, error, loading } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        await loginWithGoogle();
        setIsSigningIn(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-hfc-brown via-[#2D1302] to-[#1A0B01] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background ambient glow elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-400/10 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gold-400/5 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo + Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex bg-[#1A1411] border border-white/10 rounded-3xl p-4 shadow-2xl shadow-black/60 mb-8 relative group">
                        <div className="absolute inset-0 bg-gold-400/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <img src={hfcLogo} alt="HFC" className="h-16 w-auto relative z-10" />
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                        The <span className="text-gold-400">Nest</span>
                    </h1>
                    <p className="text-gold-400/40 text-[10px] font-black uppercase tracking-[0.4em] mt-3 font-work">
                        High Performance Analytics Portal
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1A1411] backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="text-center relative z-10">
                        <h2 className="text-white font-black text-2xl uppercase font-space tracking-tight">Identity <span className="text-gold-400">Required</span></h2>
                        <p className="text-white/40 text-[11px] font-medium font-work italic mt-2">
                            Access restricted to authorised HFC personnel.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="space-y-3 relative z-10 animate-in shake duration-500">
                            <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                <AlertCircle size={20} className="text-rose-400 shrink-0" />
                                <p className="text-rose-300 text-xs font-bold font-work italic leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading || isSigningIn}
                        className="w-full flex items-center justify-center gap-4 bg-white/5 border border-white/10 text-white font-black py-5 px-6 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-work hover:bg-white/10 hover:border-gold-400/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] relative z-10 group/btn"
                    >
                        {isSigningIn || loading ? (
                            <Loader2 size={24} className="animate-spin text-gold-400" />
                        ) : (
                            <div className="bg-white p-2 rounded-lg group-hover/btn:scale-110 transition-transform">
                                <GoogleIcon />
                            </div>
                        )}
                        <span>{isSigningIn || loading ? 'Authenticating...' : 'Sign in with Google'}</span>
                    </button>

                    <div className="pt-6 border-t border-white/5 text-center relative z-10 text-white">
                        <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] font-work">
                            End-to-end encrypted session monitoring active
                        </p>
                    </div>
                </div>

                <p className="text-center text-white/10 text-[9px] font-black uppercase tracking-[0.4em] mt-10 font-work">
                    Hawthorn Football Club © 2026 · ELITE INTEL SYSTEM
                </p>

            </div>
        </div>
    );
};

export default LoginPage;
