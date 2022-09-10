// @ts-nocheck
import dayjs from 'dayjs';
import { Dispatch, SetStateAction, useState,useEffect,useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query'
import { queryClient } from 'react-query/queryClient';
import { axiosInstance } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useUser } from '../../user/hooks/useUser';
import { AppointmentDateMap } from '../types';
import { getAvailableAppointments } from '../utils';
import { getMonthYearDetails, getNewMonthYear, MonthYear } from './monthYear';

// for useQuery call
async function getAppointments(
  year: string,
  month: string,
): Promise<AppointmentDateMap> {
  // baseUrl - constant로 지정 - config<AxiosRequestConfig>로 지정 - axios.create로 해당 config에 대한 instance 생성
  // http request 요청
  const { data } = await axiosInstance.get(`/appointments/${year}/${month}`);
  return data;
}

// types for hook return object
interface UseAppointments {
  appointments: AppointmentDateMap;
  monthYear: MonthYear;
  updateMonthYear: (monthIncrement: number) => void;
  showAll: boolean;
  setShowAll: Dispatch<SetStateAction<boolean>>;
}

// useAppointments의 목적.
//   1. 사용자에 의해 선택된 년/월을 추적한다.
//     a. 컴포넌트가 훅에 변경사항을 알리는 방법이 존재해야 한다.
//   2. 사용자가 선택한 년/월에 대한 예약들을 반환해야 한다.
//     a. AppointmentDateMap 형식에 맞게 반환해야 한다. (appointment arrays indexed by day of month)
//     b. 전월, 익월에 대한 데이터를 prefetch한다.
//   3. 모든 예약 / 예약 가능한 날짜를 추적해야 한다.
//     a. return the only the applicable appointments for the current monthYear
export function useAppointments(): UseAppointments {
  const currentMonthYear = getMonthYearDetails(dayjs());
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const nextMonthYear = getNewMonthYear(monthYear,1);
    queryClient.prefetchQuery(
      [queryKeys.appointments,nextMonthYear.year,nextMonthYear.month],
      () => getAppointments(nextMonthYear.year,nextMonthYear.month)
    )
  }, [queryClient,monthYear]);

  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }

  

  const { user } = useUser();

  const selectFn = useCallback((data) => getAvailableAppointments(data,user),[user]);

  // placeholder data
  const fallback = [];

  // 모든 요청에 동일한 키를 사용한다면, state의 값이 달라져도 새로운 요청을 하지 않는다.
  // => 쿼리 데이터가 stale 상태이지만, refetch-trigger할 대상이 없다.
  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments,monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month,
      {
        select: showAll ? undefined : selectFn
      }
  ))
  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}



