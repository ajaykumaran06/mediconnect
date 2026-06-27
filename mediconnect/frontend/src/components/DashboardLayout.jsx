import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Heart, LayoutDashboard, Calendar, FileText, Clock,
  Stethoscope, Users, UserCheck, BarChart2, LogOut,
  Menu, X, ChevronRight, Settings,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import toast from 'react-hot-toast';

const NAV = {
  patient: [
    { label: 'Dashboard',        icon: LayoutDashboard, to: '/patient' },
    { label: 'Book Appointment', icon: Calendar,         to: '/patient/book' },
    { label: 'Prescriptions',    icon: FileText,         to: '/patient/prescriptions' },
    { label: 'Medical History',  icon: Clock,            to: '/patient/history' },
    { label: 'Symptom Checker',  icon: Stethoscope,      to: '/patient/symptoms' },
    { label: 'My Profile',       icon: Settings,         to: '/patient/profile' },
  ],
  doctor: [
    { label: 'Dashboard',        icon: LayoutDashboard,  to: '/doctor' },
    { label: 'Appointments',     icon: Calendar,          to: '/doctor/appointments' },
    { label: 'New Prescription', icon: FileText,          to: '/doctor/prescriptions/new' },
    { label: 'My Profile',       icon: Settings,          to: '/doctor/profile' },
  ],
  admin: [
    { label: 'Dashboard',        icon: LayoutDashboard,  to: '/admin' },
    { label: 'Users',            icon: Users,             to: '/admin/users' },
    { label: 'Doctors',          icon: UserCheck,         to: '/admin/doctors' },
  ],
};

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const active = location.pathname === item.to ||
    (item.to !== '/' && location.pathname.startsWith(item.to));
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
        active
          ? 'bg-primary-500 text-white shadow-sm shadow-primary-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
      {!collapsed && active && (
        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg
          opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          {item.label}
        </span>
      )}
    </Link>
  );
}

/**
 * DashboardLayout — wraps all authenticated pages with a collapsible sidebar.
 *
 * Usage:
 *   <DashboardLayout>
 *     <YourPageContent />
 *   </DashboardLayout>
 */
export default function DashboardLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`
        flex flex-col bg-white border-r border-gray-100 h-full
        transition-all duration-200
        ${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b border-gray-100 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <Heart className="w-6 h-6 text-primary-500 fill-primary-100 shrink-0" />
        {(!collapsed || mobile) && (
          <span className="font-display font-bold text-primary-600 text-lg">MediConnect</span>
        )}
      </div>

      {/* User chip */}
      {(!collapsed || mobile) && (
        <div className="mx-3 mt-4 p-3 bg-primary-50 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-primary-600 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            collapsed={collapsed && !mobile}
            onClick={() => mobile && setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Bottom: language + logout */}
      <div className="px-2 pb-4 space-y-1 border-t border-gray-100 pt-3">
        {(!collapsed || mobile) && (
          <div className="px-1 pb-2">
            <LanguageSwitcher className="w-full" />
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          title={collapsed && !mobile ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobile) && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col h-full relative">
        <Sidebar />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="w-64 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-1.5 font-display font-bold text-primary-600">
            <Heart className="w-5 h-5 fill-primary-100 text-primary-500" /> MediConnect
          </Link>
          <div className="w-5" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
