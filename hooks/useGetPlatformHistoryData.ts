"use client";

import { getOpportunitiesData } from "@/queries/opportunities-api";
import { getPlatformHistoryData } from "@/queries/platform-history-api";
import {
  TGetOpportunitiesParams,
  TGetPlatformHistoryParams,
  TOpportunity,
} from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function useGetPlatformHistoryData(
  params: TGetPlatformHistoryParams
) {
  const { platform_id, token, period } = params;

  const { data, isLoading, isError } = useQuery<TOpportunity[], Error>({
    queryKey: ["platformHistory", platform_id, token, period],
    queryFn: async () => {
      try {
        const responseData = await getPlatformHistoryData(params);
        return responseData;
      } catch (error) {
        // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
        return [];
      }
    },
    staleTime: Infinity,
    refetchInterval: 60000,
  });
  return { data: data || [], isLoading, isError };
}
