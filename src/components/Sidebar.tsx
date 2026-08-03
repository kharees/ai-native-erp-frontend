'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  Receipt,
  LineChart,
  Database,
  ChevronDown,
  Sparkles,
  Truck
} from 'lucide-react';
import { cn } from './ui/cn';
import { useAIChat } from '@/contexts/AIChatContext';

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  {
    name: 'Master Foundation',
    href: '/users',
    icon: <Users size={18} />,
    children: [
      { name: 'Users', href: '/users' },
      { name: 'Organization', href: '/organization' },
      { name: 'RBAC & Roles', href: '/rbac' },
      { name: 'Audit Log', href: '/audit' },
      { name: 'Sessions', href: '/sessions' },
      { name: 'Intelligence', href: '/intelligence' },
    ],
  },
  {
    name: 'Universal Inventory',
    href: '/universal-inventory',
    icon: <PackageSearch size={18} />,
    children: [
      { name: 'Overview', href: '/universal-inventory' },
      { name: 'Items', href: '/universal-inventory/items' },
      { name: 'Categories', href: '/universal-inventory/categories' },
      { name: 'Brands', href: '/universal-inventory/brands' },
      { name: 'UOM', href: '/universal-inventory/uom' },
      { name: 'Warehouses', href: '/universal-inventory/warehouses' },
      { name: 'Warehouse Bins', href: '/universal-inventory/warehouses/bins' },
      { name: 'Stock', href: '/universal-inventory/stock' },
      { name: 'Ledger', href: '/universal-inventory/ledger' },
      { name: 'Batch Tracking', href: '/universal-inventory/tracking/batches' },
      { name: 'Expiry Tracking', href: '/universal-inventory/tracking/expiry' },
      { name: 'Serial Tracking', href: '/universal-inventory/tracking/serials' },
      { name: 'Reports', href: '/universal-inventory/reports' },
      { name: 'Standard Reports', href: '/universal-inventory/reports/standard' },
      { name: 'AI Intelligence', href: '/universal-inventory/intelligence' },
    ],
  },
  {
    name: 'Omnichannel Billing',
    href: '/omnichannel-billing/analytics/dashboard',
    icon: <Receipt size={18} />,
    children: [
      { name: 'Sales Dashboard', href: '/omnichannel-billing/analytics/dashboard' },
      { name: 'Financial Analytics', href: '/omnichannel-billing/analytics/financial' },
      { name: 'Sales Analytics', href: '/omnichannel-billing/analytics/sales' },
      { name: 'Customers', href: '/omnichannel-billing/customers' },
      { name: 'Capture Order (Photo)', href: '/omnichannel-billing/capture' },
      { name: 'Quotations', href: '/omnichannel-billing/quotations' },
      { name: 'Orders', href: '/omnichannel-billing/orders' },
      { name: 'Order Queue', href: '/omnichannel-billing/order-queue' },
      { name: 'POS', href: '/omnichannel-billing/pos' },
      { name: 'Invoices', href: '/omnichannel-billing/invoices' },
      { name: 'Payments', href: '/omnichannel-billing/payments' },
      { name: 'Receipts', href: '/omnichannel-billing/receipts' },
      { name: 'Outstanding', href: '/omnichannel-billing/outstanding' },
      { name: 'Collections', href: '/omnichannel-billing/collections' },
      { name: 'Fulfillment', href: '/omnichannel-billing/fulfillment' },
      { name: 'Shipping', href: '/omnichannel-billing/shipping' },
      { name: 'Taxes', href: '/omnichannel-billing/taxes' },
      { name: 'Notes', href: '/omnichannel-billing/notes' },
    ],
  },
  {
    name: 'Procurement',
    href: '/procurement/purchase-orders',
    icon: <Truck size={18} />,
    children: [
      { name: 'Purchase Orders', href: '/procurement/purchase-orders' },
    ],
  },
  {
    name: 'AI Assistant & Finance',
    href: '/finance/reports/dashboard',
    icon: <LineChart size={18} />,
    children: [
      { name: 'Reports Dashboard', href: '/finance/reports/dashboard' },
      { name: 'Chart of Accounts', href: '/finance/chart-of-accounts' },
      { name: 'General Ledger', href: '/finance/general-ledger' },
      { name: 'Journal Entries', href: '/finance/journal-entries' },
      { name: 'Accounts Payable', href: '/finance/accounts-payable' },
      { name: 'Accounts Receivable', href: '/finance/accounts-receivable' },
      { name: 'Banking', href: '/finance/banking' },
      { name: 'Expenses', href: '/finance/expenses' },
      { name: 'Assets', href: '/finance/assets' },
      { name: 'Budgeting', href: '/finance/budgeting' },
      { name: 'Forecasting', href: '/finance/forecasting' },
      { name: 'Trial Balance', href: '/finance/reports/trial-balance' },
      { name: 'Profit & Loss', href: '/finance/reports/profit-and-loss' },
      { name: 'Balance Sheet', href: '/finance/reports/balance-sheet' },
      { name: 'Cash Flow', href: '/finance/reports/cash-flow' },
      { name: 'GST Reports', href: '/finance/reports/gst' },
      { name: 'CFO Dashboard', href: '/finance/ai-copilot/cfo-dashboard' },
      { name: 'Risk Dashboard', href: '/finance/ai-copilot/risk-dashboard' },
    ],
  },
  {
    name: 'Data Migration Hub',
    href: '/migration',
    icon: <Database size={18} />,
    children: [
      { name: 'Overview', href: '/migration' },
      { name: 'Connectors', href: '/migration/connectors' },
      { name: 'Execution', href: '/migration/execution' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { openChat } = useAIChat();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of navItems) {
      if (item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))) {
        initial.add(item.name);
      }
    }
    return initial;
  });

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <aside className="w-[260px] md:w-[280px] bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar shrink-0 transition-colors">
      <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shrink-0 bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-900 to-accent-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          AI
        </div>
        <span className="text-body font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">AI Native ERP</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isExpanded = expanded.has(item.name);
          const hasChildren = !!item.children;
          
          let isActive = false;
          if (hasChildren) {
            isActive = item.children!.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
          } else {
            isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          }

          return (
            <div key={item.name}>
              {hasChildren ? (
                <button
                  onClick={() => toggle(item.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-body font-medium transition-colors outline-none',
                    isActive ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                  )}
                >
                  <span className={cn('shrink-0', isActive ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-400 dark:text-neutral-500')}>{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  <ChevronDown size={14} className={cn('shrink-0 transition-transform duration-200 opacity-50', isExpanded && 'rotate-180')} />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-body font-medium transition-colors outline-none',
                    isActive ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                  )}
                >
                  <span className={cn('shrink-0', isActive ? 'text-accent-600 dark:text-accent-400' : 'text-neutral-400 dark:text-neutral-500')}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.name}</span>
                </Link>
              )}
              
              {hasChildren && isExpanded && (
                <div className="mt-1 flex flex-col gap-0.5 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800 ml-3">
                  {item.children!.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'pl-8 pr-3 py-1.5 text-body rounded-md transition-colors',
                          isChildActive ? 'text-accent-700 dark:text-accent-400 font-medium' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        )}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={openChat}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-body font-medium transition-colors outline-none border border-accent-200 dark:border-accent-900/50',
              'text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/40'
            )}
          >
            <Sparkles size={18} className="shrink-0 text-accent-600 dark:text-accent-400" />
            <span className="flex-1 text-left truncate">Ask AI Assistant</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
