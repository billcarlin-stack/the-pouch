import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../services/api';
import { CheckCircle, Send } from 'lucide-react';
import { clsx } from 'clsx';

const METRICS = [
    { key: 'sleep', label: 'Sleep Quality', subtitle: 'How well did you sleep last night?', emoji: '😴' },
    { key: 'soreness', label: 'Soreness Level', subtitle: 'How does your body feel? (10 = no soreness)', emoji: '💪' },
    { key: 'mood', label: 'Mood', subtitle: 'How are you feeling mentally today?', emoji: '😀' },
    { key: 'confidence', label: 'Confidence', subtitle: 'How confident do you feel for today\'s session?', emoji: '🔥' },
] as const;

const DailyCheckIn = () => {
    const { user } = useAuth();
    const [scores, setScores] = useState<Record<string, number>>({ sleep: 7, soreness: 7, mood: 7, confidence: 7 });
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!user?.jumper_no || submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            await ApiService.submitSurvey({
                player_id: user.jumper_no,
                sleep: scores.sleep,
                soreness: scores.soreness,
                stress: 10 - scores.mood, // invert mood to stress scale (10-mood = stress)
                notes: notes,
            });
            setSubmitted(true);
        } catch (err) {
            setError('Failed to submit. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-500';
        if (score >= 6) return 'text-gold-500';
        if (score >= 4) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 9) return 'Excellent';
        if (score >= 7) return 'Good';
        if (score >= 5) return 'Average';
        if (score >= 3) return 'Below Average';
        return 'Poor';
    };

    const readinessScore = (
        (scores.sleep * 0.3) +
        (scores.soreness * 0.25) +
        (scores.mood * 0.25) +
        (scores.confidence * 0.2)
    ).toFixed(1);

    if (submitted) {
        return (
            <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-24 w-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <CheckCircle size={48} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight font-space">Check-In <span className="text-emerald-400">Complete</span></h2>
                        <p className="text-white/50 mt-4 font-work text-sm">Your readiness score: <span className={`font-black text-2xl ml-2 ${getScoreColor(parseFloat(readinessScore))}`}>{readinessScore}</span></p>
                    </div>
                    <button
                        onClick={() => { setSubmitted(false); setScores({ sleep: 7, soreness: 7, mood: 7, confidence: 7 }); setNotes(''); }}
                        className="text-[10px] font-black text-gold-400 uppercase tracking-[0.2em] hover:text-white transition-colors font-work"
                    >
                        Submit Another Entry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1000px] mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="h-[1px] w-10 bg-gold-400/40"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold-400/80 font-work">Wellbeing & Readiness</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tight font-space">
                    Daily <span className="text-gold-400">Check-In</span>
                </h1>
                <p className="text-white/50 text-sm font-medium mt-1 font-work italic">
                    Pre-training wellbeing survey — {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {/* Readiness Preview */}
            <div className="bg-[#1A1411] rounded-[2rem] border border-white/5 shadow-2xl p-8 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-gold-400/60 uppercase tracking-[0.3em] font-work mb-2">Estimated Readiness</p>
                    <p className="text-sm text-white/50 font-medium font-work italic">Based on your current responses</p>
                </div>
                <div className={`text-6xl font-black font-space tracking-tighter relative z-10 ${getScoreColor(parseFloat(readinessScore))}`}>
                    {readinessScore}
                    <span className="text-lg font-bold text-white/20 ml-1">/10</span>
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
                {METRICS.map(({ key, label, subtitle, emoji }) => (
                    <div key={key} className="bg-white/5 rounded-[2rem] border border-white/5 p-8 transition-all duration-300 hover:border-gold-400/20 group">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl bg-[#1A1411] p-4 rounded-2xl border border-white/5 group-hover:border-gold-400/20 transition-all">{emoji}</div>
                                <div>
                                    <h3 className="font-black text-white text-xl uppercase font-space tracking-tight">{label}</h3>
                                    <p className="text-[11px] text-white/50 font-work italic mt-1">{subtitle}</p>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end`}>
                                <div className={`text-4xl font-black font-space tracking-tighter ${getScoreColor(scores[key])}`}>
                                    {scores[key]}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${getScoreColor(scores[key])}`}>{getScoreLabel(scores[key])}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={scores[key]}
                                onChange={(e) => setScores(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                className="w-full h-3 bg-[#1A1411] rounded-full appearance-none cursor-pointer accent-gold-400"
                            />
                            <div className="flex justify-between text-[10px] text-white/20 font-black mt-3 px-1 font-space">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <span key={n} className={clsx(scores[key] === n && 'text-gold-400 scale-125 transition-transform')}>{n}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes */}
            <div className="bg-[#1A1411] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <label className="text-[10px] font-black text-gold-400/60 uppercase tracking-[0.3em] font-work mb-4 block relative z-10">
                    Additional Notes (Optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Anything the coaching staff should know today..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-400/50 focus:border-gold-400/50 resize-none font-work italic placeholder:text-white/20 transition-all relative z-10"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-[1.5rem] p-6 text-sm font-bold font-work text-center">
                    {error}
                </div>
            )}


            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gold-500 text-[#0F0A07] font-black py-5 rounded-full text-[11px] uppercase tracking-[0.2em] font-work hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_-5px_rgba(246,176,0,0.4)] relative z-10"
            >
                {submitting ? (
                    <div className="h-5 w-5 border-2 border-[#0F0A07]/30 border-t-[#0F0A07] rounded-full animate-spin" />
                ) : (
                    <>
                        <Send size={16} />
                        Transmit Readiness Data
                    </>
                )}
            </button>
        </div>
    );
};

export default DailyCheckIn;
