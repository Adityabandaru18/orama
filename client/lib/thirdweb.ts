import { createThirdwebClient, getContract } from "thirdweb";
import {sepolia } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || " ",
});

export const contract = getContract({
  client,
  chain: sepolia,
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || " ",
});

