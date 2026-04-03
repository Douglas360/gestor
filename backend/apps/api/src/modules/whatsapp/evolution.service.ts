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
      headers: {
        apikey,
        'Content-Type': 'application/json'
      },
      timeout: 30_000
    });
  }

  async createInstance(input: {
    instanceName: string;
    token: string;
    webhookUrl: string;
    webhookSecret: string;
    tenantId?: string;
  }) {
    const { data } = await this.http.post('/instance/create', {
      instanceName: input.instanceName,
      integration: 'WHATSAPP-BAILEYS',
      token: input.token,
      qrcode: true,
      rejectCall: true,
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      syncFullHistory: true,
      webhook: {
        url: input.webhookUrl,
        byEvents: true,
        base64: true,
        headers: {
          'X-Webhook-Secret': input.webhookSecret,
          ...(input.tenantId ? { 'X-Tenant-Id': input.tenantId } : {}),
          'Content-Type': 'application/json'
        },
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
      }
    });

    return data;
  }

  async getQrCode(instanceName: string) {
    // v2 docs: GET /instance/connect/{instance}
    const { data } = await this.http.get(`/instance/connect/${encodeURIComponent(instanceName)}`);
    return data;
  }

  async getStatus(instanceName: string) {
    // v2 docs: GET /instance/connectionState/{instance}
    const { data } = await this.http.get(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
    return data;
  }

  async deleteInstance(instanceName: string) {
    // v2 docs: DELETE /instance/delete/{instance}
    const { data } = await this.http.delete(`/instance/delete/${encodeURIComponent(instanceName)}`);
    return data;
  }
}
