#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { PlayClient } from './services/play-client.js';
import { IapHandlers } from './handlers/iap.js';

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME ?? 'com.example.yourapp';

class GooglePlayIapServer {
  private server: Server;
  private client: PlayClient;
  private iapHandlers: IapHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'google-play-iap-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
    }

    this.client = new PlayClient(credentialsPath, packageName);
    this.iapHandlers = new IapHandlers(this.client);

    this.setupHandlers();
  }

  private buildToolsList() {
    return [
      {
        name: 'list_in_app_products',
        description:
          'List all in-app products (managed products, one-time purchases) for the app. Does not include subscriptions.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: {
              type: 'string',
              description: 'App package name (default: from env GOOGLE_PLAY_PACKAGE_NAME)',
            },
            maxResults: {
              type: 'number',
              description: 'Max products to return (default: 100)',
            },
          },
        },
      },
      {
        name: 'create_in_app_product',
        description:
          'Create a managed in-app product (one-time purchase, e.g. lifetime unlock). Use for lytquiz_pro_lifetime_.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: { type: 'string', description: 'App package name (optional)' },
            productId: {
              type: 'string',
              description: 'Unique product ID (e.g. lytquiz_pro_lifetime_)',
            },
            title: { type: 'string', description: 'Store listing title' },
            description: { type: 'string', description: 'Store listing description' },
            priceUsd: {
              type: 'number',
              description: 'Price in USD (e.g. 49.99 for lifetime)',
            },
            autoConvertMissingPrices: {
              type: 'boolean',
              description: 'Auto-convert prices for other regions (default: true)',
            },
          },
          required: ['productId', 'title', 'description', 'priceUsd'],
        },
      },
      {
        name: 'list_subscriptions',
        description: 'List all subscriptions for the app.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: { type: 'string', description: 'App package name (optional)' },
            pageSize: { type: 'number', description: 'Max subscriptions to return (default: 100)' },
          },
        },
      },
      {
        name: 'create_subscription',
        description:
          'Create a subscription (monthly or yearly). Use for lytquiz_pro_monthly or lytquiz_pro_yearly. Base plan is created in DRAFT; activate in Play Console.',
        inputSchema: {
          type: 'object',
          properties: {
            packageName: { type: 'string', description: 'App package name (optional)' },
            productId: {
              type: 'string',
              description: 'Unique product ID (e.g. lytquiz_pro_monthly)',
            },
            title: { type: 'string', description: 'Store listing title' },
            description: { type: 'string', description: 'Store listing description' },
            priceUsd: {
              type: 'number',
              description: 'Price in USD (e.g. 2.99 for monthly, 19.99 for yearly)',
            },
            duration: {
              type: 'string',
              enum: ['P1M', 'P1Y'],
              description: 'P1M = monthly, P1Y = yearly',
            },
            regionsVersion: {
              type: 'string',
              description: 'Regions version (default: 2022/01)',
            },
          },
          required: ['productId', 'title', 'description', 'priceUsd', 'duration'],
        },
      },
    ];
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.buildToolsList(),
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
        try {
          const args = (request.params.arguments || {}) as Record<string, unknown>;

          const formatResponse = (data: unknown) => ({
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(data, null, 2),
              },
            ],
          });

          switch (request.params.name) {
            case 'list_in_app_products':
              return formatResponse(
                await this.iapHandlers.listInAppProducts({
                  packageName: args.packageName as string | undefined,
                  maxResults: args.maxResults as number | undefined,
                })
              );

            case 'create_in_app_product':
              return formatResponse(
                await this.iapHandlers.createInAppProduct({
                  packageName: args.packageName as string | undefined,
                  productId: args.productId as string,
                  title: args.title as string,
                  description: args.description as string,
                  priceUsd: args.priceUsd as number,
                  autoConvertMissingPrices: args.autoConvertMissingPrices as boolean | undefined,
                })
              );

            case 'list_subscriptions':
              return formatResponse(
                await this.iapHandlers.listSubscriptions({
                  packageName: args.packageName as string | undefined,
                  pageSize: args.pageSize as number | undefined,
                })
              );

            case 'create_subscription':
              return formatResponse(
                await this.iapHandlers.createSubscription({
                  packageName: args.packageName as string | undefined,
                  productId: args.productId as string,
                  title: args.title as string,
                  description: args.description as string,
                  priceUsd: args.priceUsd as number,
                  duration: args.duration as 'P1M' | 'P1Y',
                  regionsVersion: args.regionsVersion as string | undefined,
                })
              );

            default:
              throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
              );
          }
        } catch (error) {
          const err = error as Error & { response?: { data?: unknown } };
          const message =
            err.response?.data != null
              ? `Google Play API error: ${JSON.stringify(err.response.data)}`
              : err.message ?? 'Unknown error';
          throw new McpError(ErrorCode.InternalError, message);
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Play IAP MCP server running on stdio');
  }
}

const server = new GooglePlayIapServer();
server.run().catch(console.error);
