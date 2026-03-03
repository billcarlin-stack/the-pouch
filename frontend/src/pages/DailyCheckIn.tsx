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
            <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-hfc-brown">Check-In Complete!</h2>
                        <p className="text-gray-500 mt-2">Your readiness score: <span className={`font-black text-xl ${getScoreColor(parseFloat(readinessScore))}`}>{readinessScore}</span></p>
                    </div>
                    <button
                        onClick={() => { setSubmitted(false); setScores({ sleep: 7, soreness: 7, mood: 7, confidence: 7 }); setNotes(''); }}
                        className="text-sm font-bold text-hfc-brown hover:underline"
                    >
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-black text-hfc-brown tracking-tight font-outfit uppercase">
                    Daily <span className="text-hfc-brown">Check-In</span>
                </h1>
                <p className="text-gray-500 text-sm font-medium mt-1">
                    Pre-training wellbeing survey — {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {/* Readiness Preview */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estimated Readiness</p>
                    <p className="text-sm text-gray-500 mt-1">Based on your current responses</p>
                </div>
                <div className={`text-4xl font-black ${getScoreColor(parseFloat(readinessScore))}`}>
                    {readinessScore}
                    <span className="text-sm font-bold text-gray-300 ml-1">/10</span>
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-5">
                {METRICS.map(({ key, label, subtitle, emoji }) => (
                    <div key={key} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{emoji}</span>
                                <div>
                                    <h3 className="font-bold text-hfc-brown">{label}</h3>
                                    <p className="text-xs text-gray-400">{subtitle}</p>
                                </div>
                            </div>
                            <div className={`text-2xl font-black ${getScoreColor(scores[key])}`}>
                                {scores[key]}
                                <span className="text-xs font-bold text-gray-300 ml-1">{getScoreLabel(scores[key])}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={scores[key]}
                                onChange={(e) => setScores(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-hfc-brown"
                            />
                            <div className="flex justify-between text-[10px] text-gray-300 font-bold mt-1 px-0.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                    <span key={n} className={clsx(scores[key] === n && 'text-hfc-brown font-black')}>{n}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                    Additional Notes (Optional)
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Anything the coaching staff should know today..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-hfc-brown/20 resize-none"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-4 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-hfc-brown to-hfc-brown text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest hover:from-hfc-brown hover:to-hfc-brown transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-hfc-brown/20"
            >
                {submitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Send size={16} />
                        Submit Check-In
                    </>
                )}
            </button>
        </div>
    );
};

export default DailyCheckIn;
