'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageShell, Card, CardContent, Button, Input, Alert } from '@/components/ui';
import { Play, Pause } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Session {
  id: string;
  session_status: string;
  opening_balance: number;
  opened_at: string;
}

interface HoldBill {
  id: string;
  session_id: string;
  reference_name: string | null;
  cart_data: Record<string, unknown>;
}

const BASE = '/api/v1/omnichannel-billing/pos';

export default function POSPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [holdReference, setHoldReference] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(`${BASE}/sessions`), apiClient.get(`${BASE}/hold-bills`)])
      .then(([sessionRes, holdRes]) => {
        setSessions(sessionRes.data.items || []);
        setHoldBills(holdRes.data.items || []);
      })
      .catch(() => setError('Failed to load POS data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeSession = sessions.find((s) => s.session_status === 'OPEN');

  const handleStartSession = async () => {
    if (!userId) return;
    setError('');
    try {
      await apiClient.post(`${BASE}/sessions`, { user_id: userId, opening_balance: parseFloat(openingBalance) || 0 });
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to start session');
    }
  };

  const handleHoldBill = async () => {
    if (!activeSession) return;
    setError('');
    try {
      await apiClient.post(`${BASE}/hold-bills`, {
        session_id: activeSession.id,
        reference_name: holdReference || null,
        cart_data: {},
      });
      setHoldReference('');
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to hold bill');
    }
  };

  return (
    <PageShell 
      title="POS Terminal" 
      actions={
        activeSession ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-light dark:bg-green-900/20 text-success-dark dark:text-green-400 rounded-md border border-success-200 dark:border-green-800 font-medium text-sm">
            Session Open (Balance: {formatCurrency(activeSession.opening_balance)})
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="Opening balance"
              className="w-32"
            />
            <Button variant="primary" onClick={handleStartSession} leftIcon={<Play size={16} />}>Start Session</Button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}
        
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Held Bills */}
          <Card className="flex-1 min-h-[400px] flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Held Bills</h2>
            </div>
            <CardContent className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <p className="text-neutral-500 text-body text-center mt-8">Loading...</p>
              ) : holdBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 mt-12">
                  <Pause size={32} className="mb-2 opacity-50" />
                  <p className="text-body">No bills on hold.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {holdBills.map((h) => (
                    <li key={h.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-md border border-neutral-200 dark:border-neutral-800 text-body font-medium text-neutral-900 dark:text-neutral-100">
                      {h.reference_name || `Bill ${h.id.slice(0, 8)}`}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Hold Action */}
          <Card className="w-full lg:w-80 shrink-0 h-fit">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Hold Current Bill</h2>
            </div>
            <CardContent className="p-4 space-y-4">
              <Input
                placeholder="Reference name (optional)"
                value={holdReference}
                onChange={(e) => setHoldReference(e.target.value)}
                disabled={!activeSession}
              />
              <Button
                variant={activeSession ? 'primary' : 'secondary'}
                fullWidth
                onClick={handleHoldBill}
                disabled={!activeSession}
                className={activeSession ? 'bg-success hover:bg-success-dark text-white' : ''}
              >
                {activeSession ? 'Hold Bill' : 'Start a session to hold bills'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
