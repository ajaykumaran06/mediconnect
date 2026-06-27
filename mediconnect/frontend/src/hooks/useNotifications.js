import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

/**
 * useNotifications — full notifications API for components.
 *
 * Usage:
 *   const { notifications, unread, markRead, markAllRead, remove } = useNotifications();
 */
export function useNotifications() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: data?.notifications || [],
    unread:        data?.unreadCount    || 0,
    isLoading,
    error,
    markRead:     (id) => markRead.mutate(id),
    markAllRead:  ()   => markAllRead.mutate(),
    remove:       (id) => remove.mutate(id),
    isMarkingAll: markAllRead.isPending,
  };
}

export default useNotifications;
