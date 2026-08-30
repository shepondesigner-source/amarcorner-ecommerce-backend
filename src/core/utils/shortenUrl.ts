import axios from "axios";

export async function shortenUrl(url: string): Promise<string> {
  try {
    const { data } = await axios.get("https://tinyurl.com/api-create.php", {
      params: { url },
      timeout: 5000,
    });
    const short = String(data).trim();
    return short.startsWith("http") ? short : url;
  } catch {
    return url;
  }
}
