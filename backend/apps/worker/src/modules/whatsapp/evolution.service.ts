import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class EvolutionService {
  private http: AxiosInstance;

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    if (!baseURL) throw new Error('EVOLUTION_API_URL is required');
    if (!apikey) throw new Error('EVOLUTION_API_KEY is required');

    this.http = axios.create({
      baseURL,
      headers: { apikey, 'Content-Type': 'application/json' },
      timeout: 30_000
    });
  }

  async sendButtons(instanceName: string, input: {
    to: string;
    title: string;
    body: string;
    footer?: string;
    buttons: Array<{ id: string; text: string }>;
  }) {
    // v2 docs: POST /message/sendButtons/{instance}
    const number = String(input.to || '').trim().replace(/^\+/, '');
    const { data } = await this.http.post(`/message/sendButtons/${encodeURIComponent(instanceName)}`, {
      number,
      title: input.title,
      description: input.body,
      footer: input.footer,
      // Evolution expects: { type: 'reply', displayText: string, id: string }
      // (this maps to nativeFlowMessage.buttons[].buttonParamsJson)
      buttons: input.buttons.map((b) => ({
        type: 'reply',
        displayText: b.text,
        id: b.id
      }))
    });
    return data;
  }

  async sendText(instanceName: string, input: { to: string; text: string }) {
    const number = String(input.to || '').trim().replace(/^\+/, '');
    try {
      const { data } = await this.http.post(`/message/sendText/${encodeURIComponent(instanceName)}`, {
        number,
        text: input.text
      });
      return data;
    } catch (err: any) {
      const detail = err?.response?.data ? JSON.stringify(err.response.data) : err?.message;
      throw new Error(`Evolution sendText failed: ${detail || 'unknown error'}`);
    }
  }

  async getStatus(instanceName: string) {
    // v2 docs: GET /instance/connectionState/{instance}
    const { data } = await this.http.get(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
    return data;
  }

  async fetchInstances() {
    const { data } = await this.http.get(`/instance/fetchInstances`);
    return data as Array<any>;
  }

  async getOwnerJid(instanceName: string): Promise<string | null> {
    try {
      const insts = await this.fetchInstances();
      const found = (insts || []).find((x: any) => x?.name === instanceName);
      return found?.ownerJid || null;
    } catch {
      return null;
    }
  }
}

