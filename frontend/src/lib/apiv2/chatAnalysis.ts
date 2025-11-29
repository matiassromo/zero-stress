import { httpAnalysis } from "./http";

export interface ChartResponse {
  type: string;
  title: string;
  image_base64: string;
}

export interface AnalysisResponse {
  explanation: string;
  sql_query: string;
  charts: ChartResponse[];
}

export interface AnalysisRequest {
  prompt: string;
  exclude_tables?: string[];
}

export async function analyzeData(
  prompt: string,
  excludeTables?: string[]
): Promise<AnalysisResponse> {
  const requestBody: AnalysisRequest = {
    prompt,
    ...(excludeTables && { exclude_tables: excludeTables }),
  };

  const response = await httpAnalysis<AnalysisResponse>("/api/v1/analysis", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  return response;
}

export default {
  analyzeData,
};
