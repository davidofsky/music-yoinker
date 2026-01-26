import { NextResponse } from 'next/server';

export function getQueryParam(req: Request, param: string): string | null {
  return new URL(req.url).searchParams.get(param);
}

export function validateRequiredParam(
  param: string | null,
  paramName: string
): NextResponse | null {
  if (!param) {
    return NextResponse.json(
      { error: `Parameter '${paramName}' is required` },
      { status: 400 }
    );
  }
  return null;
}

export async function addDownloadStatus<T extends object>(
  items: T[],
  statusChecker: (item: T) => Promise<boolean>
): Promise<Array<T & { isDownloaded: boolean }>> {
  return Promise.all(
    items.map(async (item) => {
      const isDownloaded = await statusChecker(item);
      return { ...item, isDownloaded };
    })
  );
}

export async function handleApiCall<T>(
  callback: () => Promise<T>,
  errorMessage: string = 'Request failed'
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const data = await callback();
    return { data, error: null };
  } catch (err) {
    logger.error(err);
    return {
      data: null,
      error: NextResponse.json({ error: errorMessage }, { status: 500 }),
    };
  }
}
