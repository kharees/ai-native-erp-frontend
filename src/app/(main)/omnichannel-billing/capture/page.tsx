'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import apiClient, { isApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { orderCaptureService } from '@/services/orderCaptureService';
import { PageShell, Button, Card, CardContent, FormSection, FormRow, Select, Input, Alert, Badge } from '@/components/ui';
import { Camera, Check, FileText } from 'lucide-react';
import type {
  CapturedOrderDraft,
  CapturedOrderDraftLineItem,
  ConfirmedInvoiceSummary,
  ConfirmedQuotationSummary,
  OrderCaptureTargetType,
} from '@/types/orderCapture';

interface SimpleOption {
  id: string;
  name: string;
}

interface ItemSearchResult {
  id: string;
  name: string;
  sku: string;
}

function ItemPicker({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (item: ItemSearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      apiClient
        .get('/api/v1/universal-inventory/items', { params: { search: query, limit: 10 } })
        .then((res) => setResults(res.data?.items ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <Input
        label=""
        placeholder={value ? 'Change item...' : 'Search for the right item...'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg max-h-48 overflow-auto">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery(item.name);
                setOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer text-neutral-900 dark:text-neutral-100"
            >
              {item.name} <span className="text-neutral-500">({item.sku})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrderCapturePage() {
  const tenantId = useAuthStore((s) => s.user?.tenant_id);

  const [customers, setCustomers] = useState<SimpleOption[]>([]);
  const [warehouses, setWarehouses] = useState<SimpleOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState<CapturedOrderDraft | null>(null);
  const [lines, setLines] = useState<CapturedOrderDraftLineItem[]>([]);
  const [confirming, setConfirming] = useState<OrderCaptureTargetType | null>(null);
  const [confirmedInvoice, setConfirmedInvoice] = useState<ConfirmedInvoiceSummary | null>(null);
  const [confirmedQuotation, setConfirmedQuotation] = useState<ConfirmedQuotationSummary | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) {
      setImageUrl(null);
      return;
    }
    let cancelled = false;
    orderCaptureService
      .getDraftImageUrl(draft.id)
      .then((res) => {
        if (!cancelled) setImageUrl(res.url);
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draft]);

  useEffect(() => {
    apiClient.get('/api/v1/omnichannel-billing/customers/').then((res) => {
      setCustomers((res.data?.items ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    }).catch(() => { });
    apiClient.get('/api/v1/universal-warehousing/warehouses').then((res) => {
      setWarehouses((res.data?.items ?? []).map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })));
    }).catch(() => { });
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setConfirmedInvoice(null);
    setConfirmedQuotation(null);
    try {
      const result = await orderCaptureService.uploadOrderPhoto(
        file,
        customerId || undefined,
        warehouseId || undefined
      );
      setDraft(result);
      setLines(result.parsed_line_items);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to upload and parse the order photo.');
    } finally {
      setUploading(false);
    }
  }, [file, customerId, warehouseId]);

  const updateLine = (index: number, patch: Partial<CapturedOrderDraftLineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const allLinesResolved = lines.length > 0 && lines.every((l) => !l.needs_review);

  const handleSaveCorrections = useCallback(async () => {
    if (!draft) return;
    setError('');
    try {
      const updated = await orderCaptureService.updateDraftLines(draft.id, {
        corrected_lines: lines,
        customer_id: customerId || undefined,
        warehouse_id: warehouseId || undefined,
      });
      setDraft(updated);
      setLines(updated.parsed_line_items);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to save corrections.');
    }
  }, [draft, lines, customerId, warehouseId]);

  const handleConfirm = useCallback(async (targetType: OrderCaptureTargetType) => {
    if (!draft) return;
    setConfirming(targetType);
    setError('');
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await orderCaptureService.confirmDraft(draft.id, idempotencyKey, targetType);
      if (targetType === 'quotation') {
        setConfirmedQuotation(result as ConfirmedQuotationSummary);
      } else {
        setConfirmedInvoice(result as ConfirmedInvoiceSummary);
      }
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to confirm the order.');
    } finally {
      setConfirming(null);
    }
  }, [draft]);

  return (
    <PageShell title="Capture Order from Photo">
      <div className="space-y-6 max-w-5xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">
          Take a photo of a handwritten order -- it gets parsed into draft line items you can review, then confirm into
          either a real invoice (stock deducted immediately) or a quotation (stock only reserved).
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        {confirmedInvoice ? (
          <Card className="bg-success-light/20 dark:bg-green-950/20 border-success-light dark:border-green-900">
            <CardContent className="p-8 text-center space-y-4 flex flex-col items-center">
              <Check className="w-12 h-12 text-success-dark dark:text-green-500 mb-2" />
              <div>
                <p className="text-success-dark dark:text-green-400 font-semibold text-lg">Invoice created and stock updated.</p>
                <p className="text-body text-neutral-600 dark:text-neutral-400 mt-1">
                  Invoice <span className="font-mono text-neutral-900 dark:text-neutral-100">{confirmedInvoice.invoice_number}</span> — total {confirmedInvoice.total_amount}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setDraft(null);
                  setLines([]);
                  setFile(null);
                  setConfirmedInvoice(null);
                }}
              >
                Capture Another Order
              </Button>
            </CardContent>
          </Card>
        ) : confirmedQuotation ? (
          <Card className="bg-accent-50/50 dark:bg-accent-950/20 border-accent-200 dark:border-accent-900">
            <CardContent className="p-8 text-center space-y-4 flex flex-col items-center">
              <FileText className="w-12 h-12 text-accent-600 dark:text-accent-500 mb-2" />
              <div>
                <p className="text-accent-700 dark:text-accent-400 font-semibold text-lg">Quotation created -- stock reserved, not deducted.</p>
                <p className="text-body text-neutral-600 dark:text-neutral-400 mt-1">
                  Quotation <span className="font-mono text-neutral-900 dark:text-neutral-100">{confirmedQuotation.quotation_number}</span>
                </p>
              </div>
              {confirmedQuotation.short_items.length > 0 && (
                <Alert variant="warning" className="text-left mt-4 w-full">
                  Note: {confirmedQuotation.short_items.length} line{confirmedQuotation.short_items.length > 1 ? 's' : ''}{' '}
                  currently exceed available stock -- the quotation was still created; check availability before converting to an invoice.
                </Alert>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setLines([]);
                    setFile(null);
                    setConfirmedQuotation(null);
                  }}
                >
                  Capture Another Order
                </Button>
                <Link href={`/omnichannel-billing/quotations/${confirmedQuotation.quotation_id}`}>
                  <Button variant="primary">View Quotation</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : !draft ? (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Order Details">
                <div className="space-y-6">
                  <FormRow>
                    <Select label="Customer (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">Set later during review...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                    <Select label="Warehouse (optional)" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                      <option value="">Set later during review...</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Select>
                  </FormRow>

                  <div className="space-y-2">
                    <label className="block text-caption font-medium text-neutral-700 dark:text-neutral-300">Order Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-neutral-500
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-accent-50 file:text-accent-700
                        dark:file:bg-accent-950/30 dark:file:text-accent-400
                        hover:file:bg-accent-100 dark:hover:file:bg-accent-900/50
                        transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-800 rounded-md py-1 px-1 bg-white dark:bg-neutral-900"
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!file || !tenantId}
                    isLoading={uploading}
                    className="w-full"
                    leftIcon={!uploading ? <Camera size={18} /> : undefined}
                  >
                    Upload & Parse
                  </Button>
                </div>
              </FormSection>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {imageUrl && (
              <Card>
                <CardContent className="p-4 flex flex-col items-center bg-neutral-50 dark:bg-neutral-900/50">
                  <p className="text-caption text-neutral-500 mb-4 w-full text-center">
                    Original photo (link expires a few minutes after loading -- reload the page for a fresh one).
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Uploaded order photo" className="max-h-96 rounded-md shadow-sm border border-neutral-200 dark:border-neutral-800 object-contain" />
                </CardContent>
              </Card>
            )}
            
            <Card>
              <div className="overflow-x-auto">
                <table data-testid="capture-review-table" className="w-full text-left text-body">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Raw Text</th>
                      <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 w-1/3">Item</th>
                      <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 w-32">Qty</th>
                      <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 w-40">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                    {lines.map((line, i) => (
                      <tr key={i} data-testid={`capture-review-row-${i}`} className={line.needs_review ? 'bg-warning-light/10 dark:bg-warning-dark/10' : ''}>
                        <td className="px-4 py-3 align-top">
                          <div className="text-neutral-900 dark:text-neutral-100 font-medium">{line.raw_text}</div>
                          {line.needs_review && (
                            <Badge data-testid={`capture-confidence-${i}`} variant="warning" className="mt-2 inline-flex">
                              Needs review ({(line.match_confidence * 100).toFixed(0)}%)
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {line.needs_review ? (
                            <ItemPicker
                              value={line.matched_item_id}
                              onSelect={(item) =>
                                updateLine(i, {
                                  matched_item_id: item.id,
                                  match_confidence: 1.0,
                                  needs_review: line.unit_price > 0,
                                })
                              }
                            />
                          ) : (
                            <span className="text-neutral-600 dark:text-neutral-400 py-2 inline-block">
                              {line.matched_item_id ? 'Matched Successfully' : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input
                            label=""
                            type="number"
                            step="any"
                            value={line.quantity ?? ''}
                            onChange={(e) => updateLine(i, { quantity: e.target.value ? Number(e.target.value) : null })}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input
                            label=""
                            type="number"
                            step="any"
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(i, {
                                unit_price: Number(e.target.value),
                                needs_review: !line.matched_item_id || Number(e.target.value) <= 0,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="flex flex-wrap gap-4 items-center pt-4">
              <Button variant="outline" onClick={handleSaveCorrections}>
                Save Corrections
              </Button>
              <div className="flex-1" />
              {!allLinesResolved && (
                <span className="text-caption text-warning-dark dark:text-amber-500 font-medium">
                  Resolve every highlighted line before confirming.
                </span>
              )}
              <Button
                variant="primary"
                onClick={() => handleConfirm('invoice')}
                disabled={!allLinesResolved || confirming !== null}
                isLoading={confirming === 'invoice'}
              >
                Confirm as Invoice
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleConfirm('quotation')}
                disabled={!allLinesResolved || confirming !== null}
                isLoading={confirming === 'quotation'}
              >
                Confirm as Quotation
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
