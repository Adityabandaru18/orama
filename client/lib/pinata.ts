import axios from "axios";

const PINATA_API_KEY = "d35256e53455f8fedd0f"
const PINATA_SECRET_API_KEY = "7586c9c49a4dec12047321ab47f49b72262e3946f87434f7315a1276c6b3635b"
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  const missing: string[] = [];
  if (!PINATA_API_KEY) missing.push("NEXT_PUBLIC_PINATA_API_KEY");
  if (!PINATA_SECRET_API_KEY) missing.push("NEXT_PUBLIC_PINATA_SECRET_API_KEY");
  throw new Error(`Pinata env missing: ${missing.join(", ")}`);
}

export const uploadToPinata = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", options);

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );
    return res.data.IpfsHash as string;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};

export function toGatewayUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  // Already an http(s) URL
  if (/^https?:\/\//i.test(value)) return value;
  // ipfs://CID[/path]
  if (/^ipfs:\/\//i.test(value)) {
    const path = value.replace(/^ipfs:\/\//i, "");
    return PINATA_GATEWAY + path;
  }
  // Assume bare CID
  return PINATA_GATEWAY + value;
}
