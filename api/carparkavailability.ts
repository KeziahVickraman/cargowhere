import type { Request, Response } from 'express';

const LTA_CARPARK_API_URL = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LTACarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // e.g., "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y' | string; // C: Cars, H: Heavy Vehicle, Y: Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

export interface LTACarparkResponse {
  'odata.metadata'?: string;
  value: LTACarparkItem[];
}

export interface ApiResponsePayload {
  success: boolean;
  source: 'LTA_DATAMALL' | 'DATA_GOV_FALLBACK' | 'PENDING_CONFIG';
  timestamp: string;
  totalRecords: number;
  message?: string;
  data: LTACarparkItem[];
  metadata?: {
    agencies?: Record<string, number>;
    lotTypes?: Record<string, number>;
    skip?: number;
    hasMore?: boolean;
  };
}

/**
 * Fetch a single page from LTA DataMall
 */
async function fetchLTAPage(accountKey: string, skip = 0): Promise<LTACarparkResponse> {
  const url = skip > 0 ? `${LTA_CARPARK_API_URL}?$skip=${skip}` : LTA_CARPARK_API_URL;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      AccountKey: accountKey.trim(),
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LTA DataMall responded with ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<LTACarparkResponse>;
}

/**
 * Fallback to public data.gov.sg carpark availability if LTA key is not yet configured
 */
async function fetchFallbackDataGov(): Promise<LTACarparkItem[]> {
  const res = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];

  const json = await res.json();
  const records = json.items?.[0]?.carpark_data || [];
  const items: LTACarparkItem[] = [];

  for (const rec of records) {
    for (const info of rec.carpark_info || []) {
      items.push({
        CarParkID: rec.carpark_number,
        Area: 'Singapore',
        Development: `Carpark ${rec.carpark_number}`,
        Location: '',
        AvailableLots: parseInt(info.lots_available, 10) || 0,
        LotType: info.lot_type || 'C',
        Agency: 'HDB',
      });
    }
  }
  return items;
}

/**
 * Serverless / Express Handler for CarParkAvailabilityv2
 */
export async function handleCarparkAvailability(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Get AccountKey from environment or optional request header override
  const accountKey =
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string | undefined) ||
    '';

  const skipParam = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
  const fetchAll = req.query.fetchAll === 'true';

  // If no account key is provided yet
  if (!accountKey || accountKey.trim() === '') {
    try {
      const fallbackItems = await fetchFallbackDataGov();
      const payload: ApiResponsePayload = {
        success: true,
        source: 'PENDING_CONFIG',
        timestamp: new Date().toISOString(),
        totalRecords: fallbackItems.length,
        message:
          'LTA_ACCOUNT_KEY environment variable is not configured yet. Providing live data.gov.sg fallback lots. Add LTA_ACCOUNT_KEY to your environment variables to stream directly from LTA DataMall.',
        data: fallbackItems.slice(0, 500),
      };
      return res.status(200).json(payload);
    } catch {
      return res.status(200).json({
        success: false,
        source: 'PENDING_CONFIG',
        timestamp: new Date().toISOString(),
        totalRecords: 0,
        message:
          'LTA_ACCOUNT_KEY environment variable is not configured yet. Please configure LTA_ACCOUNT_KEY.',
        data: [],
      });
    }
  }

  try {
    let allRecords: LTACarparkItem[] = [];

    if (fetchAll) {
      // LTA returns 500 records per page. Iterate until exhausted (usually 3-4 pages)
      let currentSkip = 0;
      let hasMore = true;
      const MAX_PAGES = 10;
      let pageCount = 0;

      while (hasMore && pageCount < MAX_PAGES) {
        pageCount++;
        const pageResult = await fetchLTAPage(accountKey, currentSkip);
        const records = pageResult.value || [];
        allRecords.push(...records);

        if (records.length < 500) {
          hasMore = false;
        } else {
          currentSkip += 500;
        }
      }
    } else {
      const pageResult = await fetchLTAPage(accountKey, skipParam);
      allRecords = pageResult.value || [];
    }

    // Optional filtering by agency or lotType
    const agencyFilter = req.query.agency as string | undefined;
    const lotTypeFilter = req.query.lotType as string | undefined;

    let filteredRecords = allRecords;
    if (agencyFilter) {
      filteredRecords = filteredRecords.filter(
        (r) => r.Agency.toLowerCase() === agencyFilter.toLowerCase()
      );
    }
    if (lotTypeFilter) {
      filteredRecords = filteredRecords.filter(
        (r) => r.LotType.toLowerCase() === lotTypeFilter.toLowerCase()
      );
    }

    // Calculate metadata
    const agencies: Record<string, number> = {};
    const lotTypes: Record<string, number> = {};
    for (const item of filteredRecords) {
      agencies[item.Agency] = (agencies[item.Agency] || 0) + 1;
      lotTypes[item.LotType] = (lotTypes[item.LotType] || 0) + 1;
    }

    const payload: ApiResponsePayload = {
      success: true,
      source: 'LTA_DATAMALL',
      timestamp: new Date().toISOString(),
      totalRecords: filteredRecords.length,
      data: filteredRecords,
      metadata: {
        agencies,
        lotTypes,
        skip: skipParam,
        hasMore: allRecords.length === 500 && !fetchAll,
      },
    };

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('Error querying LTA DataMall:', error);
    
    // Attempt fallback to keep application functional
    try {
      const fallbackItems = await fetchFallbackDataGov();
      return res.status(200).json({
        success: false,
        source: 'DATA_GOV_FALLBACK',
        timestamp: new Date().toISOString(),
        totalRecords: fallbackItems.length,
        message: `LTA DataMall query error: ${error.message}. Returning data.gov.sg fallback.`,
        data: fallbackItems.slice(0, 500),
      });
    } catch {
      return res.status(502).json({
        success: false,
        source: 'LTA_DATAMALL',
        timestamp: new Date().toISOString(),
        totalRecords: 0,
        message: error.message || 'Failed to fetch carpark data from LTA DataMall',
        data: [],
      });
    }
  }
}

// Default export compatible with serverless function runtimes
export default handleCarparkAvailability;
