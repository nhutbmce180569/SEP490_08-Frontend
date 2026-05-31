import { useQuery } from '@tanstack/react-query';
import { getTours } from '../../tour/services/tour.service';

export const useTourOptions = () => {
  const query = useQuery({
    queryKey: ['tourOptions'],
    queryFn: async () => {
      const response = await getTours(1, 100);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const options = (query.data || [])
    .filter((tour) => tour.status === 'Active')
    .map((tour) => ({
      label: tour.name,
      value: tour.id,
    }));

  return {
    options: [{ label: 'All tours (no restriction)', value: '' }, ...options],
    isLoading: query.isLoading,
  };
};
