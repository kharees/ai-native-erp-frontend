import Link from 'next/link';
import { PageShell, Card, CardContent, Badge } from '@/components/ui';
import { Box, ListTree, Tags, Scale } from 'lucide-react';

export default function UniversalInventoryDashboard() {
  return (
    <PageShell title="Universal Dynamic Inventory" actions={<Badge variant="neutral">Phase 1: Master Data</Badge>}>
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">
          Manage items, variants, hierarchy, and core product metadata.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Item Master" description="Manage all universal products, variants, and dynamic attributes." link="/universal-inventory/items" icon={<Box size={24} className="text-accent-500" />} />
          <DashboardCard title="Categories" description="Manage product hierarchy and classifications." link="/universal-inventory/categories" icon={<ListTree size={24} className="text-success-500" />} />
          <DashboardCard title="Brands" description="Manage manufacturer and brand records." link="/universal-inventory/brands" icon={<Tags size={24} className="text-warning-500" />} />
          <DashboardCard title="Units of Measure" description="Manage base units and conversion factors." link="/universal-inventory/uom" icon={<Scale size={24} className="text-indigo-500" />} />
        </div>
      </div>
    </PageShell>
  );
}

function DashboardCard({ title, description, link, icon }: { title: string, description: string, link: string, icon: React.ReactNode }) {
  return (
    <Link href={link} className="block group">
      <Card className="h-full transition-all group-hover:border-accent-500 group-hover:shadow-md cursor-pointer">
        <CardContent className="p-6 flex flex-col h-full gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">{title}</h3>
          </div>
          <p className="text-body text-neutral-600 dark:text-neutral-400 flex-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
