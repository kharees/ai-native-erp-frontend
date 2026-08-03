'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore errors on logout — always clear local state
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      leftIcon={<LogOut size={14} aria-hidden />}
    >
      Logout
    </Button>
  );
}
