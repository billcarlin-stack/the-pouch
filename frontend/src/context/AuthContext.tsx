import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { api } from '../services/api';

export interface AuthUser {
    role: 'coach' | 'player';
    name: string;
    jumper_no: number | null;
    player_id: number | null;
    initials: string;
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    loginWithGoogle: () => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                // Re-verify with backend to get role on page reload
                try {
                    const idToken = await fbUser.getIdToken();
                    const resp = await api.post('/auth/verify', { idToken });
                    setUser(resp.data);
                } catch (e: any) {
                    const msg = e.response?.data?.message || e.response?.data?.error || 'Access denied.';
                    setError(msg);
                    setUser(null);
                    // Sign out of Firebase if backend rejects this account
                    await signOut(auth);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async (): Promise<boolean> => {
        setError(null);
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // Verify token with our backend and get role
            const resp = await api.post('/auth/verify', { idToken });
            setUser(resp.data);
            setFirebaseUser(result.user);
            return true;
        } catch (e: any) {
            if (e.code === 'auth/popup-closed-by-user') {
                // User simply closed the popup, not an error
                setLoading(false);
                return false;
            }
            const msg = e.response?.data?.message || e.response?.data?.error || 'Sign-in failed. Please try again.';
            setError(msg);
            // If backend rejected, sign out of Firebase too
            await signOut(auth).catch(() => null);
            setLoading(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
        setError(null);
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, error, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
