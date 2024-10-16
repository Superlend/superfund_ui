import { request } from "./request";
import { TGetOpportunitiesParams, TOpportunity } from "@/types";

export async function getOpportunitiesData(
  params: TGetOpportunitiesParams
) {
  const {
    type,
    chain_ids = [],
    tokens = [],
    trend = true,
    limit = 0,
  } = params;

  return request<TOpportunity[]>({
    method: "POST",
    path: `/opportunities/${type}`,
    body: {
      chain_ids,
      tokens,
      trend,
      limit,
    },
  });
}
