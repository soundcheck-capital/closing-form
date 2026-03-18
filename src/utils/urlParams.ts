export const getCompanyNameFromUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('companyName')?.trim() || '';
};
