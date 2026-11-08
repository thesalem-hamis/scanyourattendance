import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DEFAULT_MESSAGE_TEMPLATES, type MessageTemplateKey } from '@/config/messageTemplates';
import { getTemplates, resetTemplate, saveTemplate, type Templates } from '../services/settingsService';

export const settingsKeys = {
  templates: ['settings', 'templates'] as const,
  staff: ['settings', 'staff'] as const,
};

/**
 * The wording of the messages. `templates` is ALWAYS usable: while loading, or if loading
 * fails, it is the built-in wording, so sending a message is never blocked by settings.
 */
export function useMessageTemplates() {
  const query = useQuery({
    queryKey: settingsKeys.templates,
    queryFn: getTemplates,
    staleTime: 5 * 60_000,
  });
  const templates: Templates = query.data ?? { ...DEFAULT_MESSAGE_TEMPLATES };
  return { templates, settled: query.isSuccess || query.isError, isError: query.isError };
}

export function useTemplateMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: settingsKeys.templates });

  const save = useMutation({
    mutationFn: ({ key, text }: { key: MessageTemplateKey; text: string }) => saveTemplate(key, text),
    onSuccess: async () => {
      await refresh();
      toast.success('Wording saved');
    },
  });

  const reset = useMutation({
    mutationFn: (key: MessageTemplateKey) => resetTemplate(key),
    onSuccess: async () => {
      await refresh();
      toast.success('Back to the built-in wording');
    },
  });

  return { save, reset };
}
