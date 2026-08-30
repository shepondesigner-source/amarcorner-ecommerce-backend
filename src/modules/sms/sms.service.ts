import axios from "axios";
import { config } from "../../config/env";
import { BadRequestError } from "../../core/errors/HttpError";

const SMS_ERROR_MESSAGES: Record<string, string> = {
  "1002": "Sender Id/Masking Not Found",
  "1003": "API Not Found",
  "1004": "SPAM Detected",
  "1005": "Internal Error",
  "1006": "Internal Error",
  "1007": "Balance Insufficient",
  "1008": "Message is empty",
  "1009": "Message Type Not Set (text/unicode)",
  "1010": "Invalid User & Password",
  "1011": "Invalid User Id",
  "1012": "Invalid Number",
  "1013": "API limit error",
  "1014": "No matching template",
  "1015": "SMS Content Validation Fails",
  "1016": "IP address not allowed",
  "1019": "Sms Purpose Missing",
};

export type SmsType = "text" | "unicode";
export type SmsLabel = "transactional" | "promotional";

export type SendSmsOptions = {
  contacts: string | string[];
  message: string;
  type?: SmsType;
  label?: SmsLabel;
  scheduledDateTime?: string;
};

function normalizeContacts(contacts: string | string[]) {
  const list = Array.isArray(contacts) ? contacts : [contacts];
  return list
    .map((c) => c.trim())
    .filter(Boolean)
    .join("+");
}

/**
 * The gateway is inconsistent about how it reports errors: sometimes a bare
 * code ("1003"), sometimes "Error: 1003", sometimes JSON with error_code/
 * error_msg (and its own error_msg, e.g. "Api Key Not Found", is more
 * specific than our static table) — and sometimes it uses a non-2xx status
 * for the same payload. Handle all of these.
 */
function parseGatewayError(data: unknown): string | undefined {
  if (data === null || data === undefined) return undefined;

  if (typeof data === "number") {
    const code = String(data);
    return SMS_ERROR_MESSAGES[code];
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (SMS_ERROR_MESSAGES[trimmed]) return SMS_ERROR_MESSAGES[trimmed];

    const match = trimmed.match(/^error:?\s*(\d{4})$/i);
    const code = match?.[1];
    return code ? SMS_ERROR_MESSAGES[code] : undefined;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const rawCode = record.error_code ?? record.error ?? record.response_code;
    const code = rawCode !== undefined ? String(rawCode) : undefined;
    const rawMessage = record.error_msg ?? record.message;

    if (record.status === "failed" || (code && SMS_ERROR_MESSAGES[code])) {
      if (typeof rawMessage === "string" && rawMessage.trim()) return rawMessage;
      return code
        ? SMS_ERROR_MESSAGES[code] || `SMS gateway error ${code}`
        : "SMS gateway request failed";
    }
  }

  return undefined;
}

function assertConfigured() {
  if (!config.sms.apiKey) {
    throw new BadRequestError("SMS_API_KEY is not configured");
  }
}

type GatewayRequest = {
  method?: "get" | "post";
  params?: Record<string, string>;
  data?: Record<string, unknown>;
};

async function requestGateway(path: string, options: GatewayRequest = {}) {
  assertConfigured();
  const { method = "get", params, data: body } = options;

  let data: unknown;
  try {
    const res = await axios.request({
      url: `${config.sms.baseUrl}${path}`,
      method,
      params,
      data: body,
    });
    data = res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      data = err.response.data;
    } else {
      throw new BadRequestError("Failed to reach SMS gateway");
    }
  }

  const errorMessage = parseGatewayError(data);
  if (errorMessage) {
    throw new BadRequestError(errorMessage);
  }

  return data;
}

export const SmsService = {
  async send({
    contacts,
    message,
    type = "text",
    label,
    scheduledDateTime,
  }: SendSmsOptions) {
    const contactList = normalizeContacts(contacts);
    if (!contactList) {
      throw new BadRequestError("At least one contact number is required");
    }
    if (!message?.trim()) {
      throw new BadRequestError("Message is required");
    }
    if (!config.sms.senderId) {
      throw new BadRequestError("SMS_SENDER_ID is not configured");
    }

    return requestGateway("/smsapi", {
      method: "post",
      data: {
        api_key: config.sms.apiKey,
        senderid: config.sms.senderId,
        type,
        msg: message,
        contacts: contactList,
        ...(scheduledDateTime ? { scheduledDateTime } : {}),
        ...(label ? { label } : {}),
      },
    });
  },

  async getBalance() {
    return requestGateway(`/miscapi/${config.sms.apiKey}/getBalance`);
  },

  async getPrice() {
    return requestGateway(`/miscapi/${config.sms.apiKey}/getPrice`);
  },

  async getDeliveryReport(shootId?: string) {
    const path = shootId ? `getDLR/${shootId}` : "getDLR/getAll";
    return requestGateway(`/miscapi/${config.sms.apiKey}/${path}`);
  },

  async getUnreadReplies() {
    return requestGateway(`/miscapi/${config.sms.apiKey}/getUnreadReplies`);
  },
};
