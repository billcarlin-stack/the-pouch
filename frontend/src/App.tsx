import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { PlayersList } from './pages/PlayersList';
import { PlayerDetail } from './pages/PlayerDetail';
import { InjuryDashboard } from './pages/InjuryDashboard';
import { CoachRatings } from './pages/CoachRatings';
import { RatingComparison } from './pages/RatingComparison';
import StatsPage from './pages/StatsPage';
import TeamBuilder from './pages/TeamBuilder';
import WoopGoals from './pages/WoopGoals';
import DailyCheckIn from './pages/DailyCheckIn';
import CalendarPage from './pages/CalendarPage';
import HawkAiPage from './pages/HawkAiPage';

/**
 * Route guard: only renders children if user has the required role.
 * Players trying to access coach-only routes get redirected to /.
 */
const CoachOnly = ({ children }: { children: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== 'coach') return <Navigate to="/" replace />;
  return children;
};

/**
 * Route guard: only renders children if user is a player.
 */
const PlayerOnly = ({ children }: { children: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== 'player') return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C2340] flex items-center justify-center">
        <div className="h-8 w-8 border-3 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={user?.role === 'coach' ? <Dashboard /> : <Navigate to={`/players/${user?.jumper_no}`} replace />} />

        {/* Player profile — accessible to both (coaches view any, players view their own) */}
        <Route path="players/:id" element={<PlayerDetail />} />

        {/* Coach-only routes */}
        <Route path="players" element={<CoachOnly><PlayersList /></CoachOnly>} />
        <Route path="stats" element={<CoachOnly><StatsPage /></CoachOnly>} />
        <Route path="ratings/input" element={<CoachOnly><CoachRatings /></CoachOnly>} />
        <Route path="ratings/compare" element={<CoachOnly><RatingComparison /></CoachOnly>} />
        <Route path="team-builder" element={<CoachOnly><TeamBuilder /></CoachOnly>} />

        {/* Shared routes */}
        <Route path="injuries" element={<InjuryDashboard />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="hawk-ai" element={<HawkAiPage />} />

        {/* Player-only routes */}
        <Route path="checkin" element={<PlayerOnly><DailyCheckIn /></PlayerOnly>} />
        <Route path="woop" element={<PlayerOnly><WoopGoals /></PlayerOnly>} />

        <Route path="idp" element={<div className="p-10">IDP Module Coming Soon</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
