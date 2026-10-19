import { MessageRepository } from './db.js';
import { formatError } from './format.js';

export interface NormalizedError {
  userMessage: string;
  internalCode: string;
  statusCode?: number;
  details?: any;
}

export class ErrorHandler {
  public static normalize(error: any, context?: string): NormalizedError {
    let message = 'An unexpected error occurred while processing your request.';
    let internalCode = 'ERR_INTERNAL';
    let statusCode = 500;
    let details: any = null;

    if (error?.isAxiosError || error?.response) {
      statusCode = error.response?.status || 500;
      details = {
        status: statusCode,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url ? ErrorHandler.maskUrl(error.config.url) : undefined
      };

      if (statusCode === 404) {
        message = 'The requested resource, media, or video could not be found. Please verify your link or query.';
        internalCode = 'ERR_NOT_FOUND';
      } else if (statusCode === 429) {
        message = 'Server is currently receiving high traffic. Please wait a moment and try again.';
        internalCode = 'ERR_RATE_LIMIT';
      } else if (statusCode === 403 || statusCode === 401) {
        message = 'The upstream source restricted access to this content. A fallback provider is being evaluated.';
        internalCode = 'ERR_UPSTREAM_RESTRICTED';
      } else if (statusCode >= 500) {
        message = 'The upstream media provider is temporarily unavailable. Please try again shortly.';
        internalCode = 'ERR_UPSTREAM_5XX';
      } else {
        message = 'Failed to fetch content from the upstream provider.';
        internalCode = 'ERR_NETWORK';
      }
    } else if (error instanceof Error) {
      details = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };

      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        message = 'The request timed out while contacting upstream services. Please try again.';
        internalCode = 'ERR_TIMEOUT';
      } else if (error.message.includes('FFmpeg') || error.message.includes('ffmpeg')) {
        message = 'Failed to process media file. Ensure the format or audio stream is supported.';
        internalCode = 'ERR_FFMPEG';
      } else if (error.message.includes('rate limit')) {
        message = error.message;
        internalCode = 'ERR_RATE_LIMIT';
      } else {
        message = 'System encountered an error during execution. Please check your command parameters.';
        internalCode = 'ERR_EXECUTION';
      }
    }

    return {
      userMessage: formatError(message, 'Execution Error'),
      internalCode,
      statusCode,
      details
    };
  }

  public static async logAndFormat(
    db: MessageRepository,
    error: any,
    jid: string,
    action: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const normalized = this.normalize(error, action);

    try {
      await db.logAudit(
        action,
        'system',
        'failure',
        {
          jid,
          internalCode: normalized.internalCode,
          statusCode: normalized.statusCode,
          errorDetails: normalized.details,
          ...metadata
        }
      );
    } catch (auditErr) {
      console.error('[ErrorHandler] Failed to write audit log:', auditErr);
    }

    return normalized.userMessage;
  }

  private static maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname.replace(/./g, (c, i) => (i < 3 ? c : '*'))}${parsed.pathname}`;
    } catch {
      return '[FILTERED_URL]';
    }
  }
}
