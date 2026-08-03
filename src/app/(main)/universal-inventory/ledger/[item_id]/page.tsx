'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';

// Matches backend/app/schemas/universal_ledger.py's UniversalInventoryLedgerResponse
// exactly -- the endpoint has no transaction_type/quantity/reference_no/notes
// fields; movement direction is read off movement_quantity's sign instead.
interface LedgerEntry {
  id: string;
  item_id: string;
  movement_quantity: number;
  reference_type: string;
  reference_id: string | null;
  created_at: string;
}

export default function ItemLedgerPage() {
  const params = useParams();
  const itemId = params?.item_id as string;
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!itemId) return;
    // GET /api/v1/universal-ledger/ledger/{id} never existed -- the real
    // endpoint is the list route filtered by item_id as a query param,
    // returning a paginated {items, meta} envelope.
    apiClient.get('/api/v1/universal-ledger/', { params: { item_id: itemId, limit: 100 } })
      .then(res => setEntries(Array.isArray(res.data) ? res.data : res.data.items || []))
      .catch(() => setError('Failed to load ledger entries'))
      .finally(() => setLoading(false));
  }, [itemId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/universal-inventory/ledger" className="text-blue-600 hover:underline text-sm mb-2 block">
            ← Back to Ledger
          </Link>
          <h1 className="text-2xl font-bold">Item Inventory Ledger</h1>
          <p className="text-gray-500 text-sm mt-1">Transaction history for item ID: {itemId}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Loading ledger...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No ledger entries found for this item.
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.movement_quantity >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {entry.movement_quantity > 0 ? `+${entry.movement_quantity}` : entry.movement_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {entry.reference_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {entry.reference_id || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
