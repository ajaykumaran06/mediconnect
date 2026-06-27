import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Loading Spinner ────────────────────────────────
export function LoadingSpinner({ size = 'md', center = true }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={center ? 'flex items-center justify-center py-12' : ''}>
      <Loader2 className={`${sizes[size]} text-primary-400 animate-spin`} />
    </div>
  );
}

// ─── Empty State ────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16 px-6">
      {Icon && <Icon className="w-12 h-12 text-gray-200 mx-auto mb-4" />}
      <p className="font-medium text-gray-400">{title}</p>
      {description && <p className="text-sm text-gray-300 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────
const STATUS_MAP = {
  pending:     'bg-amber-50 text-amber-700',
  confirmed:   'bg-blue-50 text-blue-700',
  completed:   'bg-green-50 text-green-700',
  cancelled:   'bg-red-50 text-red-600',
  rescheduled: 'bg-purple-50 text-purple-700',
  approved:    'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-600',
};

export function StatusBadge({ status, className = '' }) {
  const style = STATUS_MAP[status] || 'bg-gray-50 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${style} ${className}`}>
      {status}
    </span>
  );
}

// ─── Page Shell ─────────────────────────────────────
export function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────
export function StatCard({ label, value, icon: Icon, iconClass = 'bg-primary-100 text-primary-700' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center mb-3`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ─── Form Field ─────────────────────────────────────
export function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
