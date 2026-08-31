import crypto from "crypto";
import { prisma } from "../../config/prisma";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CODE_LENGTH = 7;
const MAX_ATTEMPTS = 5;

const SHORT_LINK_BASE_URL = "https://www.amarcorner.com/s";

function generateCode(length = CODE_LENGTH): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function createShortLink(url: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();
    try {
      await prisma.shortLink.create({ data: { code, url } });
      return code;
    } catch (err: any) {
      if (err?.code === "P2002") continue; // code collision, retry
      throw err;
    }
  }
  throw new Error("Failed to generate a unique short link code");
}

export async function resolveShortLink(code: string): Promise<string | null> {
  const link = await prisma.shortLink.findUnique({ where: { code } });
  return link?.url ?? null;
}

/** Creates a short link and returns the full public short URL, e.g. https://www.amarcorner.com/s/AbC12dE */
export async function shortenUrl(url: string): Promise<string> {
  try {
    const code = await createShortLink(url);
    return `${SHORT_LINK_BASE_URL}/${code}`;
  } catch (err) {
    console.error("Failed to create short link:", err);
    return url;
  }
}
