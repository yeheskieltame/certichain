const UPLOAD_FILE_ENDPOINT = "/api/pinata/upload-file";
const UPLOAD_JSON_ENDPOINT = "/api/pinata/upload-json";

// Public IPFS gateways for reading. Reading is intentionally decoupled from the
// pinning provider — content addressed by CID can be fetched from any gateway
// once at least one node has the data, so we never depend on Pinata account
// credentials for reads. User-provided gateways are tried first, then these.
const PUBLIC_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://w3s.link/ipfs/",
  "https://4everland.io/ipfs/"
];

function normalizeCid(cidOrUri: string) {
  return cidOrUri.replace(/^ipfs:\/\//, "").replace(/^\/?ipfs\//, "");
}

function normalizeGatewayBase(input: string): string {
  let base = input.trim();
  if (!base) return "";
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  try {
    const url = new URL(base);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/ipfs/";
    } else if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function appendPinataToken(url: string): string {
  const token = process.env.NEXT_PUBLIC_PINATA_GATEWAY_TOKEN;
  if (!token) return url;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".mypinata.cloud")) {
      u.searchParams.set("pinataGatewayToken", token);
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}

function getGatewayBases(): string[] {
  const userBases: string[] = [];
  const fromEnv = process.env.NEXT_PUBLIC_IPFS_GATEWAYS;
  if (fromEnv) {
    fromEnv
      .split(",")
      .map(normalizeGatewayBase)
      .filter(Boolean)
      .forEach((b) => userBases.push(b));
  }
  // Always include public fallbacks (de-duplicated) so a misconfigured or
  // unavailable user gateway never breaks reads.
  const seen = new Set(userBases);
  for (const pub of PUBLIC_GATEWAYS) {
    if (!seen.has(pub)) {
      userBases.push(pub);
      seen.add(pub);
    }
  }
  return userBases;
}

export function ipfsUrl(cid: string) {
  return `ipfs://${cid}`;
}

export function ipfsGatewayUrls(cidOrUri: string): string[] {
  const cid = normalizeCid(cidOrUri);
  return getGatewayBases().map((base) => appendPinataToken(`${base}${cid}`));
}

export function gatewayUrl(cidOrUri: string) {
  return ipfsGatewayUrls(cidOrUri)[0];
}

export async function fetchFromIpfs(cidOrUri: string, init?: RequestInit): Promise<Response> {
  const urls = ipfsGatewayUrls(cidOrUri);
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`Gateway ${url} returned ${response.status}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All IPFS gateways failed");
}

export async function uploadFileToPinata(file: Blob, filename: string) {
  const formData = new FormData();
  formData.append("file", file, filename);

  const response = await fetch(UPLOAD_FILE_ENDPOINT, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata file upload failed: ${text}`);
  }

  const data = await response.json();
  return data.IpfsHash as string;
}

export async function uploadJsonToPinata(metadata: object, filename?: string) {
  const body: Record<string, unknown> = { pinataContent: metadata };

  if (filename) {
    body.pinataMetadata = { name: filename };
  }

  const response = await fetch(UPLOAD_JSON_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinata JSON upload failed: ${text}`);
  }

  const data = await response.json();
  return data.IpfsHash as string;
}
