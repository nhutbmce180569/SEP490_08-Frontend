import { useQuery } from '@tanstack/react-query';
import { getTours } from '../../tour/services/tour.service';

import { useTranslation } from '../../../contexts/LocaleContext';

export const useTourOptions = (isAdmin: boolean = false) => {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['tourOptions'],
    queryFn: async () => {
      const response = await getTours(1, 100, undefined, undefined, !isAdmin);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tourList = (query.data || [])
    .filter((tour) => tour.status === 'Active')
    .map((tour) => ({
      label: tour.name,
      value: tour.id,
    }));

  const options = isAdmin 
    ? [{ label: t('voucher.allTours') || 'All tours (no restriction)', value: '' }, ...tourList]
    : tourList;

  return {
    options,
    isLoading: query.isLoading,
  };
};
