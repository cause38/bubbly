import type { ReactNode } from "react";

declare module "@tanstack/react-query" {
  export class QueryClient {
    constructor(options?: any);
    invalidateQueries(options: any): Promise<void>;
    cancelQueries(options: any): Promise<void>;
    setQueryData<T>(key: any, updater: T | ((old: T | undefined) => T | undefined)): void;
    getQueryData<T>(key: any): T | undefined;
  }

  export interface QueryClientProviderProps {
    client: QueryClient;
    children: ReactNode;
  }

  export const QueryClientProvider: (props: QueryClientProviderProps) => JSX.Element;

  export function useQueryClient(): QueryClient;

  export function useSuspenseQuery<TData>(options: any): {
    data: TData;
    isFetching: boolean;
  };

  export function useMutation<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown
  >(options: any): {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    isPending: boolean;
  };
}

