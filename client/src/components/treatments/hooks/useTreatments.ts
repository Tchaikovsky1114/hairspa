import type { Treatment } from '../../../../../shared/types';
import { axiosInstance } from '../../../axiosInstance';
import { useQuery } from 'react-query';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';

// for when we need a query function for useQuery
async function getTreatments(): Promise<Treatment[]> {
  const { data } = await axiosInstance.get('/treatments');
  return data;
}

export function useTreatments(): Treatment[] {
  const toast = useCustomToast();
  // 간단한 fallback을 사용해서 초기 undefined를 막을 수 있다.
  // 일일히 isLoading을 해줄 필요 없이 중앙화 할 수 있음.
  const fallback = [];
  const { data = fallback } = useQuery(queryKeys.treatments, getTreatments, {
    onError: (error) => {
      const title = error instanceof Error ? error.message : 'error connecting to the server'
      toast({title,status:'error'})
    }
  })
  return data
}
