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
};

function normalizeContacts(contacts: string | string[]) {
  const list = Array.isArray(contacts) ? contacts : [contacts];
  return list
    .map((c) => c.trim())
    .filter(Boolean)
    .join("+");
}

function extractErrorCode(data: unknown): string | undefined {
  if (data === null || data === undefined) return undefined;

  if (typeof data === "number" || typeof data === "string") {
    const value = String(data).trim();
    return SMS_ERROR_MESSAGES[value] ? value : undefined;
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidate = record.error ?? record.error_code ?? record.response_code;
    if (candidate !== undefined && SMS_ERROR_MESSAGES[String(candidate)]) {
      return String(candidate);
    }
  }

  return undefined;
}

function assertConfigured() {
  if (!config.sms.apiKey) {
    throw new BadRequestError("SMS_API_KEY is not configured");
  }
}

async function requestGateway(path: string, params?: Record<string, string>) {
  assertConfigured();

  const { data } = await axios.get(`${config.sms.baseUrl}${path}`, {
    params,
  });

  const errorCode = extractErrorCode(data);
  if (errorCode) {
    throw new BadRequestError(
      SMS_ERROR_MESSAGES[errorCode] || `SMS gateway error ${errorCode}`,
    );
  }

  return data;
}

export const SmsService = {
  async send({ contacts, message, type = "text", label }: SendSmsOptions) {
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
      api_key: config.sms.apiKey,
      type,
      contacts: contactList,
      senderid: config.sms.senderId,
      msg: message,
      ...(label ? { label } : {}),
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
