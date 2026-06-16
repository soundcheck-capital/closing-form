import FormPage from './FormPage';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ companyName?: string }>;
}) {
  const params = await searchParams;
  const companyName = params.companyName?.trim() || '';

  return <FormPage initialCompanyName={companyName} />;
}
