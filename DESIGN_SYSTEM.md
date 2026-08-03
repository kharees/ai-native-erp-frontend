# Design System — AI-Native ERP

> **Version:** 1.0.0 · **Stack:** Next.js 14 App Router · Tailwind CSS 3.4 · Inter font

This document is the single source of truth for the visual design language of the AI-Native ERP frontend. All new pages and components **must** be built using the primitives documented here. Do not introduce ad-hoc colors, font sizes, or spacing values outside this system.

---

## 1. Color Tokens

All colors are defined in [`tailwind.config.js`](./tailwind.config.js) under `theme.extend.colors`. Use them as Tailwind utility classes (`bg-accent-600`, `text-neutral-400`, etc.) or via CSS custom properties where needed.

### 1.1 Navy — Primary Brand Scale

Used for: sidebar background, page headers (large text), navigation brand elements.  
**Do NOT use for body text or UI controls** — use `neutral` for those.

| Token | Hex | Use |
|---|---|---|
| `navy-600` | `#1E3A5F` | Brand core — sidebar bg, brand logo bg |
| `navy-700` | `#172E4D` | Sidebar hover / active states |
| `navy-800` | `#0F1F35` | Deep backgrounds |
| `navy-900` | `#091221` | Near-black brand tint |

### 1.2 Accent — Enterprise Blue

Used for: **primary action buttons, links, active states, focus rings** ONLY.  
**Do NOT use decoratively** — every accent blue element should be actionable.

| Token | Hex | Use |
|---|---|---|
| `accent-600` | `#2563EB` | Primary button bg, link color, active nav indicator |
| `accent-500` | `#3B82F6` | Dark-mode primary (slightly lighter for contrast) |
| `accent-400` | `#60A5FA` | Dark-mode link hover |
| `accent-100` | `#DBEAFE` | Badge background (light mode) |

### 1.3 Neutral — Full Slate Scale

Used for: all backgrounds, borders, secondary text, dividers, placeholder text.  
**Eliminates all hardcoded `gray-*`, `white`, `black` values.**

| Token | Hex | Common Use |
|---|---|---|
| `neutral-50` | `#F8FAFC` | Light mode page background |
| `neutral-100` | `#F1F5F9` | Light mode card background |
| `neutral-200` | `#E2E8F0` | Light mode borders |
| `neutral-300` | `#CBD5E1` | Light mode secondary text |
| `neutral-400` | `#94A3B8` | **Subtitles, muted text** (≥4.5:1 on dark bg) |
| `neutral-500` | `#64748B` | Placeholder text, captions on light bg |
| `neutral-600` | `#475569` | Dark mode dividers |
| `neutral-700` | `#334155` | Dark mode borders |
| `neutral-800` | `#1E293B` | Dark mode input backgrounds, card surfaces |
| `neutral-900` | `#0F172A` | Dark mode card backgrounds |
| `neutral-950` | `#020617` | Dark mode page background |

> [!IMPORTANT]
> **The app is dark-first.** At runtime, `neutral-950` is the page background and `neutral-100` is the primary text color. When in doubt, test contrast against `neutral-950`.

### 1.4 Semantic Colors

Each semantic color has three variants:

| Color | `light` (badge bg) | `DEFAULT` (solid text/icon) | `dark` (dark bg text) |
|---|---|---|---|
| `success` | `#DCFCE7` | `#16A34A` | `#15803D` |
| `warning` | `#FEF3C7` | `#D97706` | `#B45309` |
| `danger` | `#FEE2E2` | `#DC2626` | `#B91C1C` |

**Badge pattern (light mode):**
```html
<span class="bg-success-light text-success-dark">Active</span>
```

**Badge pattern (dark mode):**
```html
<span class="dark:bg-green-950 dark:text-green-400">Active</span>
```

---

## 2. Typography Scale

All type sizes are defined in `tailwind.config.js` under `fontSize` and include `lineHeight`, `fontWeight`, and `letterSpacing`.

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `text-page-title` | 30px | 700 | 36px | Page `<h1>` (one per page) |
| `text-section-header` | 20px | 600 | 28px | Major section headings `<h2>` |
| `text-card-title` | 16px | 600 | 24px | Card headers, modal titles `<h3>` |
| `text-label` | 13px | 500 | 20px | Form labels, table column headers |
| `text-body` | 15px | 400 | 24px | Default paragraph / cell text |
| `text-caption` | 12px | 400 | 18px | Timestamps, helper text, metadata |

**Font:** Inter (Google Fonts). Registered as `--font-inter` in `app/layout.tsx`. Bound to `fontFamily.sans` in Tailwind config — all elements default to Inter.

### Example Usage

```tsx
<h1 className="text-page-title text-neutral-50">Dashboard</h1>
<p className="text-body text-neutral-400">Overview of your enterprise metrics</p>
<span className="text-caption text-neutral-500">2 minutes ago</span>
```

---

## 3. Component Library

All components live in `src/components/ui/` and are exported from `src/components/ui/index.ts`.

```tsx
import { Button, Card, CardHeader, Badge, Input, Modal, PageHeader } from '@/components/ui';
```

### 3.1 Button

Five variants. **Only one `primary` button per screen section.** Use `outline` for destructive-looking secondary actions like "Discard Changes".

```tsx
<Button variant="primary">Save Settings</Button>
<Button variant="outline">Discard Changes</Button>
<Button variant="secondary">Export</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="destructive">Delete Record</Button>

// With loading state
<Button variant="primary" isLoading={saving}>Save Settings</Button>

// With icon
<Button variant="primary" leftIcon={<Plus size={16} />}>Add Item</Button>
```

> [!CAUTION]
> **Do NOT style buttons with ad-hoc Tailwind classes.** If a new button style is needed, add a variant to `Button.tsx` and document it here.

### 3.2 Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Company Profile</CardTitle>
    <CardDescription>Basic information about your organization.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save</Button>
  </CardFooter>
</Card>
```

### 3.3 Badge

```tsx
<Badge variant="success" dot>Active</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="warning">Pending Review</Badge>
<Badge variant="accent">New</Badge>
<Badge variant="neutral">Draft</Badge>
```

### 3.4 Form Controls

All form controls share the same base styles: `bg-neutral-800 border-neutral-700`, accent-600 focus ring, danger-red error border.

```tsx
<Input label="Company Name" placeholder="Enter name" required />
<Input label="Email" type="email" error="Invalid email address" />
<Input label="Amount" leftAddon="$" type="number" />

<Select label="Currency">
  <option value="USD">USD ($)</option>
</Select>

<Textarea label="Description" rows={4} hint="Max 500 characters" />
```

### 3.5 DataTable

```tsx
const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    align: 'center',
  },
];

<DataTable
  columns={columns}
  data={users}
  keyExtractor={(r) => r.id}
  isLoading={isLoading}
  onRowClick={(row) => router.push(`/users/${row.id}`)}
/>
```

### 3.6 PageHeader

Use on every page that has a title, subtitle, and optional actions. **Do not create custom page headers.**

```tsx
<PageHeader
  title="Organization Settings"
  subtitle="Manage your company profile, branches, departments, and global preferences."
  actions={
    <>
      <Button variant="outline">Discard Changes</Button>
      <Button variant="primary">Save Settings</Button>
    </>
  }
/>
```

### 3.7 Modal

```tsx
const [open, setOpen] = useState(false);

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Delete Record"
  description="This action cannot be undone."
>
  <p className="text-body text-neutral-300">
    Are you sure you want to delete this record?
  </p>
  <Modal.Footer>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </Modal.Footer>
</Modal>
```

> [!IMPORTANT]
> The backdrop uses `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`. **Never replace this with a solid color** — the semi-transparent overlay is intentional to confirm modal context to the user.

---

## 4. Dark Mode Strategy

The app is **dark-first** using `darkMode: 'media'` (OS preference). All design tokens are defined for both modes.

| Principle | Correct | Incorrect |
|---|---|---|
| Use token scale | `text-neutral-400` | `text-gray-400` |
| Semantic text | `text-neutral-100` (primary), `text-neutral-400` (muted) | `text-white`, `#f9fafb` |
| Borders | `border-neutral-700` or `border-neutral-800` | `border-gray-700`, `border-[#374151]` |
| Page bg | `bg-neutral-950` | `bg-[#07070e]`, `bg-[#0a0a0a]` |
| Card bg | `bg-neutral-900` | `bg-gray-900`, `dark:bg-[#111827]` |

---

## 5. Known Intentional Exceptions

| Location | Deviation | Reason |
|---|---|---|
| `dynamic-inventory-form.module.css` | Uses `--erp-*` purple glassmorphism tokens | Legacy feature form — pre-dates the design system. Will be migrated in Phase 2. |
| `globals.css` `:root` | Defines CSS custom properties (`--primary`, `--surface`) | Bridge layer for existing CSS modules. Must stay in sync with `tailwind.config.js` values. |
| `Sidebar.module.css` | References `var(--primary)`, `var(--text-muted)` | CSS module syntax. Variables are re-mapped in globals.css to new token values. Acceptable until CSS modules are converted to Tailwind. |

---

## 6. Adding New Components

1. Create `src/components/ui/YourComponent.tsx`
2. Use only tokens from `tailwind.config.js` — no hardcoded hex values
3. Export from `src/components/ui/index.ts`
4. Document it in **Section 3** of this file
5. If you need a new color, add it to `tailwind.config.js` AND the CSS bridge in `globals.css`

---

## 7. Contrast Compliance

All text must meet [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html):
- **Normal text** (< 18px or not bold): ≥ **4.5:1** ratio
- **Large text** (≥ 18px or 14px bold): ≥ **3:1** ratio

| Pair | Ratio | Status |
|---|---|---|
| `neutral-100` on `neutral-950` | ~15:1 | ✅ AAA |
| `neutral-400` on `neutral-950` | ~6.5:1 | ✅ AA |
| `neutral-400` on `neutral-900` | ~5.5:1 | ✅ AA |
| `accent-400` on `neutral-900` | ~4.8:1 | ✅ AA |
| `success-dark` on `success-light` | ~5.2:1 | ✅ AA |
| `danger-dark` on `danger-light` | ~5.8:1 | ✅ AA |
| ~~`gray-400` on `#0a0a0a`~~ | ~3.5:1 | ❌ Fail (fixed) |
| ~~`bg-white dark:bg-gray-800` (no text color)~~ | variable | ❌ Fail (fixed) |
