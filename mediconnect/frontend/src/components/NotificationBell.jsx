import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Calendar, FileText, Info, AlertCircle, CheckCheck, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import useAuthStore from '../store/authStore';

const TYPE_CONFIG = {
  appointment:  { icon: Calendar,    color: 'text-blue-500',    bg: 'bg-blue-50'    },
  prescription: { icon: FileText,    color: 'text-primary-500', bg: 'bg-primary-50' },
  alert:        { icon: AlertCircle, color: 'text-red-500',     bg: 'bg-red-50'     },
  info:         { icon: Info,        color: 'text-gray-500',    bg: 'bg-gray-50'    },
};

const ROLE_LINK = {
  appointment: { patient: '/patient', doctor: '/doctor/appointments' },
  prescription: { patient: '/patient/prescriptions', doctor: '/doctor' },
};

export default function NotificationBell() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000, // poll every 30 s
    enabled: !!user,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: deleteNotif } = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif.id);
    const links = ROLE_LINK[notif.type];
    if (links && user?.role && links[user.role]) {
      navigate(links[user.role]);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={markingAll}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                >
                  {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.read ? 'bg-primary-50/40' : ''
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {notif.created_at
                          ? formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true })
                          : 'Just now'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500" aria-label="unread" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        className="text-gray-300 hover:text-gray-500 p-0.5 rounded transition-colors"
                        aria-label="Delete notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <p className="text-xs text-gray-400 text-center">Showing last 30 notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
