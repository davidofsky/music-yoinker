import axios, { AxiosInstance } from "axios";
import Config from "./config";
import logger from "./logger";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export default class Antra {
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private sessionCookie: string | null = null;

  constructor() {
    this.baseUrl = Config.ANTRA_API_URL.replace(/\/+$/, '');
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Origin': this.baseUrl,
        'Referer': `${this.baseUrl}/`,
      },
      validateStatus: () => true, // <-- Basically a try-catch, i always wanna see the response
    });
  }

  // Response bodies might bee too large. Keep them short enough to log.
  private static describe(data: unknown): string {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    if (!text) return '<empty body>';
    return text.length > 500 ? `${text.slice(0, 500)}...` : text;
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, data?: unknown): Promise<T> {
    const response = await this.client.request<T>({
      method,
      url: endpoint,
      data,
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
    });

    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const match = setCookie.map(cookie => cookie.match(/antra_session=[^;]+/)).find(Boolean);
      if (match) this.sessionCookie = match[0];
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`[Antra] HTTP ${response.status} on ${method} ${endpoint}: ${Antra.describe(response.data)}`);
    }

    return response.data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async login(): Promise<void> {
    const data = await this.request<{ ok?: boolean; username?: string }>('POST', '/api/auth/login', {
      username: Config.ANTRA_USERNAME,
      password: Config.ANTRA_PASSWORD,
    });

    if (!data?.ok) throw new Error(`[Antra] Login failed: ${JSON.stringify(data)}`);
    logger.debug(`[Antra] Logged in as ${data.username}`);
  }

  private async resolve(url: string): Promise<void> {
    const data = await this.request<{ track_count?: number }>('POST', '/api/resolve', { url });
    if (!data?.track_count) throw new Error(`[Antra] No tracks found for ${url}`);
  }

  private async createJob(url: string): Promise<string> {
    const data = await this.request<{ job_id?: string }>('POST', '/api/jobs', {
      url,
      format: 'lossless-16', // lossless-24 is only available for amazon
      start_index: 0,
      end_index: 1,
      client_packaging: false,
    });

    if (!data?.job_id) throw new Error(`[Antra] No job id returned: ${JSON.stringify(data)}`);
    return data.job_id;
  }

  private async waitForJob(jobId: string): Promise<void> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const data = await this.request<{ status?: string }>('GET', `/api/jobs/${jobId}/status`);

      if (data.status === 'complete') return;
      if (data.status === 'failed' || data.status === 'error') {
        throw new Error(`[Antra] Job ${jobId} failed: ${JSON.stringify(data)}`);
      }

      await this.sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`[Antra] Job ${jobId} did not complete within ${POLL_TIMEOUT_MS / 1000}s`);
  }

  // Returns the download url and the headers required to fetch it.
  public async getDownload(url: string): Promise<{ url: string; headers: Record<string, string> }> {
    if (!this.baseUrl) throw new Error('ANTRA_API_URL is not configured.');
    if (!Config.ANTRA_USERNAME || !Config.ANTRA_PASSWORD) {
      throw new Error('ANTRA_USERNAME and ANTRA_PASSWORD are not configured.');
    }

    logger.info(`[Antra] Requesting download for ${url}`);

    await this.login();
    await this.resolve(url);
    const jobId = await this.createJob(url);
    logger.debug(`[Antra] Job ${jobId} created, waiting for completion`);
    await this.waitForJob(jobId);

    return {
      url: `${this.baseUrl}/api/jobs/${jobId}/download`,
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
    };
  }
}