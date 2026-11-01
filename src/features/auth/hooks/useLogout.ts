import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { signOut } from '../services/authService';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Drop every cached query so the next person never sees the previous user's data.
      queryClient.clear();
      navigate(ROUTES.login, { replace: true });
    },
  });
}