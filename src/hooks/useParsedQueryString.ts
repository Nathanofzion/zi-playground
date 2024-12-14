import { parse, ParsedQs } from 'qs';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

export function parsedQueryString(search?: string): ParsedQs {
  if (!search && typeof window !== 'undefined') {
    // react-router-dom places search string in the hash
    const hash = window.location.hash;
    search = hash.substr(hash.indexOf('?'));
  }
  return search && search.length > 1
    ? parse(search, { parseArrays: false, ignoreQueryPrefix: true })
    : {};
}

export default function useParsedQueryString(): ParsedQs {
  const router = useNavigate();
  const { pathname } = router;

  // use query as parameter for parsedQueryString and memoize it
  return useMemo(() => parsedQueryString(pathname), [pathname]);
}
