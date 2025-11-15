# ORAMA — NFT Event Ticketing

End-to-end, on-chain event ticketing built with Next.js, thirdweb. Create events, sell NFT tickets, scan and verify at entry, and manage roles for admin, users, and verifiers.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)

---

## Features

- Admin event creation with image upload and pricing
- On-chain NFT ticket minting and ownership
- Role-gated dashboards (Admin, User, Verifier)
- QR-based ticket display and verification
- Live event filtering and upcoming highlights
- Wallet connect and Sepolia network support

---

## Technologies Used

- Next.js 14 (App Router), React 18
- thirdweb (wallets, contracts, transactions)
- Tailwind CSS + shadcn/ui
- Pinata (IPFS uploads and gateway)
- TypeScript

---

## Installation

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- A wallet (MetaMask) configured for Sepolia

### Steps

1. Clone the repository

```bash
git clone https://github.com/Adityabandaru18/orama-nft.git
cd orama-nft
```

2. Install dependencies

```bash
cd client
npm install
```

---

Create `client/.env.local` and set:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractOnSepolia
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret
# Optional gateway override:
# NEXT_PUBLIC_PINATA_GATEWAY=https://your-subdomain.mypinata.cloud/ipfs/
```

The app runs at `http://localhost:3000`.

---

## Usage

1. Start the dev server

```bash
cd client
npm run dev
```

2. Open http://localhost:3000
3. Connect your wallet and pick a role on `/auth`
4. Admin: create events; User: buy tickets; Verifier: scan and verify

---

## Future Enhancements

- Secondary marketplace and ticket transfers
- Seat maps and reserved seating
- Off-chain indexing for faster event/ticket queries
- Email/SMS flows for non-crypto users (custodial/onramp)
