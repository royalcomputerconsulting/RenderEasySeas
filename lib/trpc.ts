import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const trpc = {
  cruises: {
    getAll: {
      useQuery: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    },
    getById: {
      useQuery: (_id: string) => ({
        data: null,
        isLoading: false,
        error: null,
      }),
    },
  },
  offers: {
    getAll: {
      useQuery: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    },
  },
};

export const trpcClient = null;
