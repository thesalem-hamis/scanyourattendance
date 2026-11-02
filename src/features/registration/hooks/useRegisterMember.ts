import { useMutation } from '@tanstack/react-query';
import { registerMember } from '../services/registrationService';

export function useRegisterMember() {
  return useMutation({ mutationFn: registerMember });
}