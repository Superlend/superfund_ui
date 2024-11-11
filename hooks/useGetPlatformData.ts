"use client";

import { getPlatformData } from "@/queries/platform-api";
import { TGetPlatformParams, TOpportunity, TPlatform } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function useGetPlatformData(params: TGetPlatformParams) {
  const { protocol_identifier, chain_id } = params;

  const { data, isLoading, isError } = useQuery<TPlatform>({
    queryKey: ["platform", protocol_identifier, chain_id],
    queryFn: async () => {
      try {
        const responseData = await getPlatformData(params);
        return responseData;
      } catch (error) {
        // toast.error(SOMETHING_WENT_WRONG_MESSAGE, ERROR_TOAST_ICON_STYLES);
        throw new Error("There was an error while fetching Platform data");
      }
    },
    staleTime: Infinity,
    refetchInterval: 60000,
  });
  return {
    data: data || {
      platform: {
        platform_name: "",
        platform_type: "",
        protocol_identifier: "",
        name: "",
        logo: "",
        chain_id: 0,
        vaultId: "",
        morpho_market_id: "",
      },
      assets: [],
    },
    isLoading,
    isError,
  };
}
