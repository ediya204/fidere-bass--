type QueryValue = string | number | boolean | null | undefined;

export function buildQueryHref(path: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `${path}?${queryString}` : path;
}

export function appendQueryHref(path: string, query: Record<string, QueryValue>) {
  const [basePath, currentQuery = ''] = path.split('?');
  const params = new URLSearchParams(currentQuery);

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function safeBaasReturnTo(returnTo: string | null, fallback: string) {
  if (!returnTo || !returnTo.startsWith('/dashboard/baas')) {
    return fallback;
  }

  return returnTo;
}
