import { ConfigService } from '@nestjs/config';

interface SafeRequest {
  id?: unknown;
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface SafeResponse {
  statusCode?: number;
}

export const createLoggerConfig = (config: ConfigService) => {
  const isProduction = config.get('NODE_ENV') === 'production';

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',

      serializers: {
        req(req: SafeRequest) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
              'content-type': req.headers?.['content-type'],
              authorization: req.headers?.['authorization'],
            },
          };
        },
        res(res: SafeResponse) {
          return {
            statusCode: res.statusCode,
          };
        },
      },

      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          },
    },
  };
};
