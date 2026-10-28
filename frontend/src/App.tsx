import React, { useState, useEffect, useCallback } from 'react';
import { PageRoute, DashboardState } from './types';
import { api } from './services/api';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

import { LoginPage } from './pages/LoginPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { DashboardPage } from './pages/DashboardPage';
import { SensorControlPage } from './pages/SensorControlPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { BatchManagementPage } from './pages/BatchManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  // Authentication prototype state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>({
    name: 'Biotech Admin',
    email: 'admin@dryertwin.com',
    role: 'Lead Process Engineer'
  });

  // Current active navigation route
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');

  // Unified Central Dashboard State (One Source of Truth)
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Poll central state from backend
  const fetchGlobalState = useCallback(async () => {
    try {
      const data = await api.getDashboardState();
      setDashboardState(data);
      setError(null);
    } catch (err: any) {
      console.error('Error polling dashboard state:', err);
      // If error occurs, keep last state but flag error
      if (!dashboardState) {
        setError('Connecting to backend simulation engine...');
      }
    } finally {
      setLoading(false);
    }
  }, [dashboardState]);

  useEffect(() => {
    fetchGlobalState();
    // Poll every 3.5 seconds
    const interval = setInterval(fetchGlobalState, 3500);
    return () => clearInterval(interval);
  }, [fetchGlobalState]);

  const handleLoginSuccess = (user: { name: string; email: string; role: string }) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  const handleToggleDoor = async () => {
    const next = dashboardState?.digital_twin.door === 'CLOSED' ? 'OPEN' : 'CLOSED';
    try {
      await api.controlActuator({ door: next });
      await fetchGlobalState();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle chamber door');
    }
  };

  const handleBatchStatusChange = async (status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED') => {
    // Door Safety Interlock: Reject starting dryer while door is OPEN
    if (status === 'RUNNING' && dashboardState?.digital_twin.door === 'OPEN') {
      alert('Cannot start dryer. Please close the door first.');
      return;
    }

    if (dashboardState?.batch) {
      try {
        await api.updateBatch(dashboardState.batch.batch_id, { status });
        await fetchGlobalState();
      } catch (err: any) {
        alert(err.message || 'Cannot start dryer. Please close the door first.');
      }
    }
  };

  // If not authenticated, render Login + 2FA flow
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Titles and subtitles config for header
  const pageMeta: Record<PageRoute, { title: string; subtitle: string }> = {
    workflow: {
      title: 'Work Flow',
      subtitle: 'Identify the drying process step by step'
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Real-time monitoring of the food dehydration process'
    },
    sensors: {
      title: 'Live Sensor Control',
      subtitle: 'Monitor and control the simulated drying environment'
    },
    analytics: {
      title: 'Analytics',
      subtitle: 'Process performance trends and comparative batch analytics'
    },
    alerts: {
      title: 'Alerts',
      subtitle: 'Threshold warnings and system notifications'
    },
    history: {
      title: 'History',
      subtitle: 'Review batch and sensor records'
    },
    batches: {
      title: 'Batch Management',
      subtitle: 'Register food batches, setpoints and lifecycle state controls'
    },
    reports: {
      title: 'Reports',
      subtitle: 'Generate process and quality reports'
    },
    settings: {
      title: 'Settings',
      subtitle: 'System parameters, Digital Twin options and threshold configurations'
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        activeAlertCount={dashboardState?.active_alert_count || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header
          title={pageMeta[currentPage].title}
          subtitle={pageMeta[currentPage].subtitle}
          activeAlertCount={dashboardState?.active_alert_count || 0}
          onNavigateToAlerts={() => setCurrentPage('alerts')}
          onSignOut={handleSignOut}
          currentUser={currentUser}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading && !dashboardState ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">
                Initializing Digital Twin Telemetry & Simulation Engine...
              </p>
            </div>
          ) : error && !dashboardState ? (
            <div className="max-w-md mx-auto mt-20 p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-800">
              <h3 className="font-bold text-sm">Connection Warning</h3>
              <p className="text-xs mt-1">{error}</p>
              <button
                onClick={fetchGlobalState}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Retry Connection
              </button>
            </div>
          ) : dashboardState ? (
            <>
              {currentPage === 'workflow' && <WorkflowPage />}
              {currentPage === 'dashboard' && (
                <DashboardPage
                  state={dashboardState}
                  onNavigate={setCurrentPage}
                  onBatchStatusChange={handleBatchStatusChange}
                  onToggleDoor={handleToggleDoor}
                />
              )}
              {currentPage === 'sensors' && (
                <SensorControlPage
                  state={dashboardState}
                  onRefresh={fetchGlobalState}
                />
              )}
              {currentPage === 'analytics' && <AnalyticsPage />}
              {currentPage === 'alerts' && <AlertsPage />}
              {currentPage === 'history' && <HistoryPage />}
              {currentPage === 'batches' && (
                <BatchManagementPage onRefreshGlobalState={fetchGlobalState} />
              )}
              {currentPage === 'reports' && <ReportsPage />}
              {currentPage === 'settings' && (
                <SettingsPage
                  currentSettings={dashboardState.settings}
                  onRefreshGlobalState={fetchGlobalState}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
