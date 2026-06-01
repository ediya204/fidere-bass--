'use client';

import { useCallback } from 'react';

import { useRouter } from './use-router';
import { usePathname } from './use-pathname';
import { useSearchParams } from './use-search-params';

type QueryValue = string | number | boolean | null | undefined;

export function useUrlQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setQuery = useCallback(
    (updates: Record<string, QueryValue>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          value === 'all' ||
          value === false
        ) {
          params.delete(key);
          return;
        }

        params.set(key, String(value));
      });

      const queryString = params.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  return { currentHref, searchParams, setQuery };
}
