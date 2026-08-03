'use client';

import { useState } from 'react';
import { isApiError } from '@/lib/apiClient';
import { gstReportsService, type Gstr3bSummary } from '@/services/gstReportsService';
import { formatCurrency } from '@/lib/formatCurrency';
import { PageShell, Card, CardContent, FormRow, Select, Button, Alert } from '@/components/ui';
import { Download, Eye } from 'lucide-react';

function currentFinancialYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
}

function recentFinancialYears(count = 4): string[] {
  const [start] = currentFinancialYear().split('-').map((s) => 2000 + Number(s));
  return Array.from({ length: count }, (_, i) => {
    const y = start - i;
    return `${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;
  });
}

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export default function GstReportsPage() {
  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [downloading, setDownloading] = useState<'gstr1' | 'gstr3b' | null>(null);
  const [summary, setSummary] = useState<Gstr3bSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');

  const period = { financialYear, month };

  const handleDownload = async (kind: 'gstr1' | 'gstr3b') => {
    setDownloading(kind);
    setError('');
    try {
      if (kind === 'gstr1') {
        await gstReportsService.downloadGstr1(period);
      } else {
        await gstReportsService.downloadGstr3b(period);
      }
    } catch (err) {
      setError(isApiError(err) ? err.message : `Failed to export ${kind.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  const handlePreviewGstr3b = async () => {
    setLoadingSummary(true);
    setError('');
    try {
      const data = await gstReportsService.getGstr3bSummary(period);
      setSummary(data);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to load GSTR-3B summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <PageShell title="GST Reports">
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">
          Export GSTR-1 (invoice-wise outward supplies) and GSTR-3B (consolidated summary) data for your CA to file.
          This does not file with the GST portal directly.
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        <Card>
          <CardContent className="p-6">
            <FormRow>
              <Select label="Financial Year" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                {recentFinancialYears().map((fy) => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </Select>
              <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </FormRow>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2">GSTR-1</h3>
                <p className="text-body text-neutral-500 dark:text-neutral-400 mb-6">
                  Invoice-wise outward supplies: B2B, B2C Large, B2C Small, credit/debit notes, and the HSN-wise summary
                  -- one sheet per section.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleDownload('gstr1')}
                disabled={downloading === 'gstr1'}
                isLoading={downloading === 'gstr1'}
                leftIcon={<Download size={16} />}
                className="w-full"
              >
                Download GSTR-1 (.xlsx)
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2">GSTR-3B</h3>
                <p className="text-body text-neutral-500 dark:text-neutral-400 mb-6">
                  Consolidated monthly summary: total taxable value and CGST/SGST/IGST liability for the period.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreviewGstr3b}
                  isLoading={loadingSummary}
                  leftIcon={<Eye size={16} />}
                  className="flex-1"
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleDownload('gstr3b')}
                  disabled={downloading === 'gstr3b'}
                  isLoading={downloading === 'gstr3b'}
                  leftIcon={<Download size={16} />}
                  className="flex-1"
                >
                  Download (.xlsx)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {summary && (
          <Card>
            <CardContent className="p-8">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                GSTR-3B Summary &mdash; {summary.financial_year}, Month {summary.month}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">Invoices</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{summary.invoice_count}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">Taxable Value</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_taxable_value)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">Invoice Value</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_invoice_value)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">Total Tax Liability</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_tax_liability)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">CGST</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_cgst)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">SGST</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_sgst)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">IGST</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.total_igst)}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-neutral-500 mb-1">Credit/Debit Notes</p>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.credit_debit_notes_value)}</p>
                </div>
              </div>
              <Alert variant="warning" className="mt-8 text-left">
                Credit/debit note value is informational only and not netted into the totals above -- the current data
                model doesn&apos;t store a tax split for notes, so your CA should apply that adjustment manually.
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
