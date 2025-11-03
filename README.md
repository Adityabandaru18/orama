# ORAMA NFT Ticketing

End-to-end web3 ticketing platform built with Next.js (App Router), thirdweb, and a Solidity ERC-721 contract. Features include admin event management, on-chain ticket purchase, user dashboard with QR-based tickets, verifier dashboard for on-chain validation, Pinata image integration, and role-based access.

## Monorepo Layout

```
.
├─ client/                    # Next.js app (frontend)
│  ├─ app/                    # Routes (landing, auth, verify)
│  ├─ components/             # UI and feature components
│  ├─ lib/                    # thirdweb & Pinata helpers
│  └─ next.config.mjs
└─ contracts/                 # Hardhat/Foundry-like structure (Solidity contract)
   └─ contracts/MyContract.sol
```

## Prerequisites

- Node.js 18+
- pnpm or npm
- Wallet (MetaMask) on Sepolia
- thirdweb client ID
- Pinata API keys (for image upload)

## Environment Variables

Create `client/.env.local`:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContract
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret
# Optional custom gateway
# NEXT_PUBLIC_PINATA_GATEWAY=https://your-subdomain.mypinata.cloud/ipfs/
```

## Install & Run

```
cd client
npm install
npm run dev
# or
npm run build && npm run start
```

## Smart Contract (Solidity)

Contract: `contracts/contracts/MyContract.sol`

- ERC-721 based tickets with URI storage
- Roles: `DEFAULT_ADMIN_ROLE`, `USER_ROLE`, `VERIFIER_ROLE`
- Create events: `createEvent(name, location, description, date, time, ticketSupply, ticketPrice, imageUrl)`
- Buy ticket (payable): `buyTicket(eventId, tokenURI)`
- Verify ticket: `verifyTicket(ticketId)` (marks as used)
- Views: `getEvent(eventId)`, `getTotalEvents()`, `getMyTickets()`, `getTicketsOf(address)`, `ticketToEvent(ticketId)`, `checkTicketUsed(ticketId)`
- Events: `EventCreated`, `TicketPurchased`, `TicketVerified`

Deployment is assumed; set the address in `NEXT_PUBLIC_CONTRACT_ADDRESS`.

## Frontend Overview

### Libraries

- Next.js 14, React 18
- thirdweb (contracts, wallet, events)
- Tailwind-based UI (shadcn)
- Pinata (image uploads)

### Key Features

- Admin Dashboard
  - Connect wallet (admin required)
  - Create events with Pinata images (supports ipfs:// and gateway urls)
  - Overview stats

- User Dashboard
  - Connect wallet (USER_ROLE required)
  - Browse live events (from contract)
  - Purchase tickets on-chain (payable)
  - My Tickets view with QR code (activates at event time)
  - Shows Verified status if ticket was used

- Verifier Dashboard
  - Connect wallet (VERIFIER_ROLE required)
  - Scan QR or enter Ticket Code (format: `ED<base36(tokenId)>`) or numeric ID
  - Blocks verification before event start
  - Minimal success/failure modals; no local history

- Landing Page
  - Shows latest 3 events from the contract (images via Pinata gateway)

### Roles & Access Guards

- Admin page requires admin address (checked via contract `admin()`)
- User and Verifier pages require corresponding roles (`USER_ROLE` / `VERIFIER_ROLE` with `hasRole`)
- On wallet change, unauthorized access redirects to home

### Pinata Integration

`client/lib/pinata.ts` contains `uploadToPinata(file)` to get a CID and `toGatewayUrl` to resolve `ipfs://` or bare CIDs to a configured gateway.

### QR Payload

Tickets embed metadata (data:application/json;base64) with a `qr` string in the format:

```
ETKT|e=<eventId>|b=<buyer>|ts=<timestamp>|exp=<eventDate>
```

Verifier decodes the payload to locate a valid ticket for the buyer and the event.

### Ticket Code

User UI displays a friendly code only at event time: `ED<base36(tokenId).toUpperCase().padStart(6,'0')>`.
Verifier accepts either the Ticket Code or numeric tokenId.

## Adding/Changing Networks

The app targets Sepolia (Etherscan links reflect this). To switch networks, update the chain used in `client/lib/thirdweb.ts` and the Connect buttons, and redeploy the contract to that network.

## Transactions Tab Implementation Notes

We use `getContractEvents` from thirdweb to read `TicketPurchased` and `TicketVerified` logs directly from the RPC and then render a table. Rows link to Etherscan.

For very large histories, consider a dedicated indexer (The Graph or thirdweb Engine) and paginate.

## Common Issues

- Pinata keys missing: ensure `NEXT_PUBLIC_PINATA_API_KEY` and `NEXT_PUBLIC_PINATA_SECRET_API_KEY` are present in `client/.env.local`, restart dev server
- Contract address mismatch: if events/tickets don’t load, confirm `NEXT_PUBLIC_CONTRACT_ADDRESS` points to your deployed instance on the same network as your wallet
- HMR issues with thirdweb: run dev without Turbopack (`next dev`), or rebuild

## Scripts

From `client/`:

```
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production server
```

## License

MIT


