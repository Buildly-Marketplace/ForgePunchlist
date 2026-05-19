export interface ForgePunchlistOptions {
  apiUrl: string;
  bearerToken: string;
  productId?: string | number;
  includeUrlByDefault?: boolean;
  includeLogsByDefault?: boolean;
  useQueryToken?: boolean;
  accessTokenQueryParamName?: string;
  sendProductIdHeader?: boolean;
  title?: string;
  subtitle?: string;
  appName?: string;
  metadata?: Record<string, unknown>;
  transformPayload?: (payload: unknown, values: unknown, context: unknown) => unknown;
  buttonLabel?: string;
  zIndex?: number;
  maxLogEntries?: number;
}

export interface ForgePunchlistWidget {
  destroy: () => void;
}

export function initForgePunchlistWidget(options: ForgePunchlistOptions): ForgePunchlistWidget;
