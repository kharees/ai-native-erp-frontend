'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient, { isApiError } from '@/lib/apiClient';
import { quotationService, type ConvertedInvoiceSummary, type Quotation } from '@/services/quotationService';

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

export default function QuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const quotationId = params.id;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedInvoice, setConvertedInvoice] = useState<ConvertedInvoiceSummary | null>(null);

  const load = useCallback(() => {
    if (!quotationId) return;
    setLoading(true);
    setError('');
    Promise.all([
      quotationService.getQuotation(quotationId),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([q, custRes, itemRes]) => {
        setQuotation(q);
        setCustomers((custRes.data?.items ?? []).map((c: Customer) => ({ id: c.id, name: c.name })));
        setItems((itemRes.data?.items ?? []).map((i: Item) => ({ id: i.id, name: i.name })));
      })
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load quotation'))
      .finally(() => setLoading(false));
  }, [quotationId]);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;
  const itemName = (id: string) => items.find((i) => i.id === id)?.name || id;

  const isExpired = quotation?.valid_until ? new Date(quotation.valid_until) < new Date() : false;
  const isConverted = quotation?.status === 'CONVERTED' || !!convertedInvoice;

  // Draft/Expired/Converted -- everything this system can honestly derive.
  // No "Sent" state is tracked anywhere server-side (the Share button
  // below invokes the OS share sheet or a download, neither of which
  // confirms delivery), so it isn't fabricated here.
  const statusLabel = isConverted ? 'Converted to Invoice' : isExpired ? 'Expired' : quotation?.status === 'DRAFT' ? 'Draft' : quotation?.status;
  const statusColor = isConverted
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isExpired
    ? 'bg-gray-100 text-gray-600 border-gray-300'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  const handleDownload = async () => {
    if (!quotation) return;
    setDownloading(true);
    setError('');
    try {
      await quotationService.downloadQuotationPdf(quotation.id, quotation.quotation_number);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to download the quotation PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!quotation) return;
    setSharing(true);
    setError('');
    try {
      await quotationService.shareOrDownloadQuotationPdf(quotation.id, quotation.quotation_number);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to share the quotation PDF.');
    } finally {
      setSharing(false);
    }
  };

  const handleConvert = async () => {
    if (!quotation) return;
    setConverting(true);
    setError('');
    try {
      const idempotencyKey = crypto.randomUUID();
      const invoice = await quotationService.convertQuotationToInvoice(quotation.id, idempotencyKey);
      setConvertedInvoice(invoice);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to convert the quotation to an invoice.');
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <div className="p-8 max-w-4xl mx-auto">Loading quotation...</div>;
  if (!quotation) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error || 'Quotation not found.'}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/omnichannel-billing/quotations" className="text-blue-600 hover:underline text-sm mb-2 block">&larr; Back to Quotations</Link>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold font-mono">{quotation.quotation_number}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quoted to {customerName(quotation.customer_id)} · Revision v{quotation.revision_number}
          {quotation.valid_until && <> · Valid until {new Date(quotation.valid_until).toLocaleDateString()}</>}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">{error}</div>
      )}

      {convertedInvoice && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-sm">
          Converted to invoice <span className="font-mono">{convertedInvoice.invoice_number}</span> — total {convertedInvoice.total_amount}.
          Stock has now been deducted for real (the reservation this quotation held is released as part of this).
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 font-medium">Item</th>
              <th className="px-6 py-3 font-medium text-right">Qty</th>
              <th className="px-6 py-3 font-medium text-right">Unit Price</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {quotation.items.map((line) => (
              <tr key={line.id}>
                <td className="px-6 py-3">{itemName(line.item_id)}</td>
                <td className="px-6 py-3 text-right">{line.quantity}</td>
                <td className="px-6 py-3 text-right">{Number(line.unit_price).toFixed(2)}</td>
                <td className="px-6 py-3 text-right">{(line.quantity * Number(line.unit_price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <td colSpan={3} className="px-6 py-3 text-right font-semibold">Total</td>
              <td className="px-6 py-3 text-right font-semibold">{Number(quotation.total_amount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {sharing ? 'Preparing...' : 'Share'}
        </button>
        <button
          onClick={handleConvert}
          disabled={converting || isConverted}
          className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {isConverted ? 'Already Converted' : converting ? 'Converting...' : 'Convert to Invoice'}
        </button>
      </div>
    </div>
  );
}
