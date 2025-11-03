"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  Search,
  Filter,
  Wallet,
  Download,
  Share,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { UserSidebar } from "@/components/user-sidebar";
import Link from "next/link";
import Image from "next/image";
import { contract, client } from "@/lib/thirdweb";
import { readContract, prepareContractCall } from "thirdweb";
import {
  useActiveAccount,
  useActiveWalletChain,
  useSendTransaction,
} from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { toGatewayUrl } from "@/lib/pinata";
import dynamic from "next/dynamic";
const ConnectButtonDynamic = dynamic(
  () => import("thirdweb/react").then((m) => m.ConnectButton),
  { ssr: false }
);
import { useRouter } from "next/navigation";

const mockTickets = [
  {
    id: "NFT-001",
    eventName: "Tech Conference 2024",
    date: "2024-03-15",
    time: "09:00 AM",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    price: "0.1 ETH",
    status: "active",
    qrCode: "QR123456789",
    seat: "A-15",
    image: "/tech-conference-stage.jpg",
  },
  {
    id: "NFT-002",
    eventName: "Music Festival",
    date: "2024-04-20",
    time: "06:00 PM",
    location: "Austin, TX",
    venue: "Zilker Park",
    price: "0.25 ETH",
    status: "active",
    qrCode: "QR987654321",
    seat: "GA",
    image: "/music-festival-crowd.jpg",
  },
  {
    id: "NFT-003",
    eventName: "Art Exhibition",
    date: "2024-02-10",
    time: "02:00 PM",
    location: "New York, NY",
    venue: "MoMA",
    price: "0.05 ETH",
    status: "used",
    qrCode: "QR456789123",
    seat: "General",
    image: "/modern-art-gallery.jpg",
  },
];

type ChainEvent = {
  id: number;
  name: string;
  location: string;
  description: string;
  date: number; // seconds
  time: number; // seconds
  ticketSupply: number;
  ticketPriceWei: bigint;
  ticketsSold: number;
  imageUrl?: string;
};

export function UserDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [eventsError, setEventsError] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [purchasedEventIds, setPurchasedEventIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadEvents() {
      setIsLoadingEvents(true);
      setEventsError("");
      try {
        const total: any = await readContract({
          contract,
          method: "function getTotalEvents() view returns (uint256)",
          params: [],
        });
        const count = Number(total || 0);
        if (!count) {
          setEvents([]);
          setIsLoadingEvents(false);
          return;
        }
        const reads = Array.from({ length: count }, (_, i) =>
          readContract({
            contract,
            method:
              "function getEvent(uint256 eventId) view returns ((uint256 id, string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, uint256 ticketsSold, string imageUrl))",
            params: [BigInt(i + 1)],
          })
        );
        const res = await Promise.all(reads);
        const toNum = (v: any) =>
          typeof v === "bigint" ? Number(v) : Number(v);
        const mapped = res.map((e: any) => ({
          id: toNum(e.id),
          name: e.name,
          location: e.location,
          description: e.description,
          date: toNum(e.date),
          time: toNum(e.time),
          ticketSupply: toNum(e.ticketSupply),
          ticketPriceWei: BigInt(e.ticketPrice?.toString?.() || e.ticketPrice),
          ticketsSold: toNum(e.ticketsSold),
          imageUrl: e.imageUrl,
        }));
        try {
          console.log("[UserDashboard] Loaded events:", mapped);
        } catch {}
        setEvents(mapped);
      } catch (err) {
        setEvents([]);
        setEventsError("Failed to load events.");
      }
      setIsLoadingEvents(false);
    }
    loadEvents();
  }, [reloadKey]);

  // Role guard: must have USER_ROLE
  useEffect(() => {
    let cancelled = false;
    async function guard() {
      if (!account?.address) return;
      try {
        const role: any = await readContract({
          contract,
          method: "function USER_ROLE() view returns (bytes32)",
          params: [],
        });
        const ok: any = await readContract({
          contract,
          method: "function hasRole(bytes32,address) view returns (bool)",
          params: [role, account.address],
        });
        if (!cancelled && !ok) {
          try { alert("Access denied for this wallet"); } catch {}
          router.replace("/");
        }
      } catch {}
    }
    guard();
    return () => { cancelled = true; };
  }, [account?.address, router]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return events.filter((e) => e.name.toLowerCase().includes(q));
  }, [events, searchQuery]);

  // Load which events current user already owns a ticket for
  useEffect(() => {
    async function loadOwned() {
      if (!account?.address) {
        setPurchasedEventIds(new Set());
        return;
      }
      try {
        const readAny: any = readContract as any;
        let res: any;
        try {
          res = await readAny({
            contract,
            method: "function getTicketsOf(address user) view returns (uint256[])",
            params: [account.address],
          });
        } catch {
          res = await readAny({
            contract,
            method: "function getMyTickets() view returns (uint256[])",
            params: [],
            account: account?.address,
          });
        }
        const ticketIds: number[] = Array.isArray(res)
          ? res.map((x: any) => Number(x))
          : [];
        if (!ticketIds.length) {
          setPurchasedEventIds(new Set());
          return;
        }
        const eventIdReads = ticketIds.map((tid) =>
          readContract({
            contract,
            method: "function ticketToEvent(uint256) view returns (uint256)",
            params: [BigInt(tid)],
          })
        );
        const eventIdsRaw = await Promise.all(eventIdReads);
        const eventIds = new Set<number>(
          eventIdsRaw.map((v: any) => Number(v)).filter((n) => Number.isFinite(n) && n > 0)
        );
        setPurchasedEventIds(eventIds);
      } catch {
        setPurchasedEventIds(new Set());
      }
    }
    loadOwned();
  }, [account?.address, reloadKey]);

  return (
    <div className="flex h-screen bg-background">
      <UserSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                My Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your tickets and discover new events
              </p>
            </div>
            <ConnectButtonDynamic
              client={client}
              chain={sepolia}
              connectModal={{ size: "compact" }}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="tickets">
              <MyTicketsTab reloadKey={reloadKey} />
            </TabsContent>
            <TabsContent value="events">
              <EventsTab
                events={filteredEvents}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isLoading={isLoadingEvents}
                error={eventsError}
                purchasedEventIds={purchasedEventIds}
                onPurchased={() => {
                  try {
                    window.dispatchEvent(new Event("tickets:updated"));
                  } catch {}
                  setReloadKey((k) => k + 1);
                }}
              />
            </TabsContent>
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => {
        try {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}

function formatTicketCode(ticketId: number): string {
  const base = ticketId.toString(36).toUpperCase();
  return `ED${base.padStart(6, "0")}`;
}

function MyTicketsTab({ reloadKey }: { reloadKey: number }) {
  const account = useActiveAccount();
  const [tickets, setTickets] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [ticketCards, setTicketCards] = useState<
    {
      ticketId: number;
      eventId: number;
      name: string;
      date: number;
      location: string;
      imageUrl?: string;
      priceWei?: bigint;
      tokenURI?: string;
      qr?: string;
      used?: boolean;
    }[]
  >([]);

  useEffect(() => {
    async function load() {
      if (!account?.address) {
        setTickets([]);
        setTicketCards([]);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const readAny: any = readContract as any;
        // Prefer new method that accepts an address, works regardless of msg.sender
        let res: any;
        try {
          res = await readAny({
            contract,
            method:
              "function getTicketsOf(address user) view returns (uint256[])",
            params: [account.address],
          });
        } catch {
          // Fallback to legacy getMyTickets() that relies on msg.sender
          res = await readAny({
            contract,
            method: "function getMyTickets() view returns (uint256[])",
            params: [],
            account: account?.address,
          });
        }
        let arr: number[] = Array.isArray(res)
          ? res.map((x: any) => Number(x))
          : [];

        // Fallback to ERC721 owned NFTs if mapping is empty
        if (
          (!arr || arr.length === 0) &&
          (contract as any)?.erc721?.getOwned &&
          account?.address
        ) {
          try {
            const owned: any[] = await (contract as any).erc721.getOwned(
              account.address
            );
            const ownedIds = (owned || [])
              .map((n: any) => Number(n?.id ?? n?.tokenId ?? 0))
              .filter((n) => Number.isFinite(n) && n > 0);
            if (ownedIds.length) {
              arr = ownedIds;
              try {
                console.log("[UserDashboard] Fallback owned tokenIds:", arr);
              } catch {}
            }
          } catch (e) {
            try {
              console.warn(
                "[UserDashboard] erc721.getOwned fallback failed",
                e
              );
            } catch {}
          }
        }

        try {
          console.log("[UserDashboard] My tickets ids:", arr);
        } catch {}
        setTickets(arr);

        if (arr.length) {
          const items = await Promise.all(
            arr.map(async (ticketId) => {
              try {
                const eventIdAny: any = await readContract({
                  contract,
                  method:
                    "function ticketToEvent(uint256) view returns (uint256)",
                  params: [BigInt(ticketId)],
                });
                const eventId = Number(eventIdAny);
                const ev: any = await readContract({
                  contract,
                  method:
                    "function getEvent(uint256 eventId) view returns ((uint256 id, string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, uint256 ticketsSold, string imageUrl))",
                  params: [BigInt(eventId)],
                });
                const tokenUri: any = await readContract({
                  contract,
                  method:
                    "function tokenURI(uint256 tokenId) view returns (string)",
                  params: [BigInt(ticketId)],
                });
                const usedRaw: any = await readContract({
                  contract,
                  method:
                    "function checkTicketUsed(uint256 ticketId) view returns (bool)",
                  params: [BigInt(ticketId)],
                });
                let qr: string | undefined;
                if (
                  typeof tokenUri === "string" &&
                  tokenUri.startsWith("data:application/json;base64,")
                ) {
                  try {
                    const b64 = tokenUri.replace(
                      "data:application/json;base64,",
                      ""
                    );
                    const jsonStr =
                      typeof window !== "undefined"
                        ? decodeURIComponent(escape(atob(b64)))
                        : Buffer.from(b64, "base64").toString("utf-8");
                    const meta = JSON.parse(jsonStr);
                    qr = meta?.qr as string | undefined;
                  } catch {}
                }
                const item = {
                  ticketId,
                  eventId,
                  name: ev.name,
                  date: Number(ev.date),
                  location: ev.location,
                  imageUrl: ev.imageUrl as string,
                  priceWei: BigInt(
                    ev.ticketPrice?.toString?.() || ev.ticketPrice
                  ),
                  tokenURI: String(tokenUri),
                  qr,
                  used: Boolean(usedRaw),
                };
                try {
                  console.log("[UserDashboard] Ticket item:", item);
                } catch {}
                return item;
              } catch {
                return {
                  ticketId,
                  eventId: 0,
                  name: "Event",
                  date: 0,
                  location: "",
                  imageUrl: undefined,
                };
              }
            })
          );
          setTicketCards(items);
        } else {
          setTicketCards([]);
        }
      } catch (err) {
        setError("Unable to load your tickets.");
        setTickets([]);
        setTicketCards([]);
      }
      setIsLoading(false);
    }
    load();
  }, [account?.address, reloadKey]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Past events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Portfolio value</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Grid */}
      {!account?.address && (
        <div className="text-muted-foreground text-center p-6 border rounded-md">
          Connect your wallet to load your tickets.
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center p-6 border rounded-md">
          {error}
        </div>
      )}
      {account?.address && !isLoading && tickets.length === 0 && !error && (
        <div className="text-muted-foreground text-center p-6 border rounded-md">
          No tickets found.
        </div>
      )}
      {isLoading && (
        <div className="text-muted-foreground text-center p-6 border rounded-md">
          Loading tickets...
        </div>
      )}
      {!isLoading && ticketCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ticketCards.map((t) => (
            <Card key={`${t.ticketId}`} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img
                  src={
                    toGatewayUrl(t.imageUrl) ||
                    "https://source.unsplash.com/800x400/?ticket"
                  }
                  alt={t.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://source.unsplash.com/800x400/?ticket";
                  }}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    {t.date ? new Date(t.date * 1000).toLocaleString() : "-"}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {t.location}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    {Date.now() / 1000 >= (t.date || 0) && !t.used ? (
                      <>Ticket {formatTicketCode(t.ticketId)}</>
                    ) : null}
                  </span>
                  {t.used ? (
                    <Badge className="bg-green-100 text-green-700" variant="secondary">Verified</Badge>
                  ) : typeof t.priceWei !== "undefined" ? (
                    <span className="font-semibold text-primary">
                      {Number(t.priceWei) / 1e18} ETH
                    </span>
                  ) : null}
                </div>
                {t.used ? (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 text-center">
                    This ticket has been verified at entry.
                  </div>
                ) : (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          disabled={!t.qr}
                        >
                          Show QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Ticket QR</DialogTitle>
                          <DialogDescription>
                            Ticket #{t.ticketId} • {t.name}
                          </DialogDescription>
                        </DialogHeader>
                        {Date.now() / 1000 >= (t.date || 0) && (
                          <div className="text-xs text-muted-foreground text-center -mt-2 mb-2 flex items-center justify-center gap-2">
                            <span>Ticket Code:</span>
                            <span className="font-mono">{formatTicketCode(t.ticketId)}</span>
                            <CopyButton text={formatTicketCode(t.ticketId)} />
                          </div>
                        )}
                        {t.qr ? (
                          Date.now() / 1000 >= (t.date || 0) ? (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                                t.qr
                              )}`}
                              alt="Ticket QR"
                              className="mx-auto"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-6">
                              QR not activated yet. It will be available at the
                              event time.
                            </div>
                          )
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-6">
                            QR unavailable for this ticket.
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {Date.now() / 1000 >= (t.date || 0) && (
                      <div className="mt-2 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                        <span>Ticket Code:</span>
                        <span className="font-mono">{formatTicketCode(t.ticketId)}</span>
                        <CopyButton text={formatTicketCode(t.ticketId)} />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: (typeof mockTickets)[0] }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        <Image
          src={ticket.image || "/placeholder.svg"}
          alt={ticket.eventName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={false}
        />
        <Badge
          variant={ticket.status === "active" ? "default" : "secondary"}
          className="absolute top-2 right-2"
        >
          {ticket.status}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{ticket.eventName}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            {ticket.date} at {ticket.time}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            {ticket.venue}, {ticket.location}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Seat: {ticket.seat}
          </span>
          <span className="font-semibold text-primary">{ticket.price}</span>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Event Ticket</DialogTitle>
                <DialogDescription>{ticket.eventName}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-mono text-sm">{ticket.qrCode}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Show this code at the venue
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function EventsTab({
  events,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  purchasedEventIds,
  onPurchased,
}: {
  events: ChainEvent[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  error: string;
  purchasedEventIds: Set<number>;
  onPurchased: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Discover Events</CardTitle>
          <CardDescription>
            Find and purchase tickets for upcoming events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center text-muted-foreground p-6">
          Loading events...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-6">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-center text-muted-foreground p-6">
          No events available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} purchasedEventIds={purchasedEventIds} onPurchased={onPurchased} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  purchasedEventIds,
  onPurchased,
}: {
  event: ChainEvent;
  purchasedEventIds: Set<number>;
  onPurchased: () => void;
}) {
  const alreadyBought = purchasedEventIds.has(event.id);
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-muted relative h-56 md:h-64 w-full">
        <img
          src={
            toGatewayUrl(event.imageUrl) ||
            "https://source.unsplash.com/800x400/?event"
          }
          alt={event.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://source.unsplash.com/800x400/?event";
          }}
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{event.name}</CardTitle>
          <Badge variant="outline">General</Badge>
        </div>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            {new Date(event.date * 1000).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            {event.location}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-primary">
            {Number(event.ticketPriceWei) / 1e18} ETH
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.max(0, event.ticketSupply - event.ticketsSold)}/
            {event.ticketSupply} available
          </span>
        </div>
        {alreadyBought ? (
          <Button className="w-full" variant="outline" disabled>
            Already purchased
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Purchase Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase Ticket</DialogTitle>
                <DialogDescription>
                  Complete your purchase to mint your NFT ticket
                </DialogDescription>
              </DialogHeader>
              <PurchaseFlow event={event} onPurchased={onPurchased} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function PurchaseFlow({
  event,
  onPurchased,
}: {
  event: ChainEvent;
  onPurchased: () => void;
}) {
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const toWei = (numWei: bigint) => numWei; // already wei

  function makeTokenURI(): string {
    const now = Math.floor(Date.now() / 1000);
    const buyer = account?.address || "unknown";
    const qrPayload = `ETKT|e=${event.id}|b=${buyer}|ts=${now}|exp=${event.date}`;
    const metadata = {
      name: `Event Ticket #${event.id}`,
      description: `Ticket for ${event.name} at ${event.location}`,
      external_url: "",
      image: "",
      attributes: [
        { trait_type: "eventId", value: String(event.id) },
        { trait_type: "buyer", value: buyer },
        { trait_type: "eventDate", value: String(event.date) },
      ],
      qr: qrPayload,
    } as const;
    const json = JSON.stringify(metadata);
    const b64 =
      typeof window !== "undefined"
        ? btoa(unescape(encodeURIComponent(json)))
        : Buffer.from(json, "utf-8").toString("base64");
    return `data:application/json;base64,${b64}`;
  }

  function onBuy() {
    setError("");
    if (!account) {
      setError("Please connect your wallet.");
      return;
    }
    if (!activeChain || activeChain.id !== sepolia.id) {
      setError("Please switch your wallet network to Sepolia.");
      return;
    }
    try {
      const tx = prepareContractCall({
        contract,
        method: "function buyTicket(uint256 eventId, string tokenURI) payable",
        params: [BigInt(event.id), makeTokenURI()],
        value: toWei(event.ticketPriceWei),
      });
      sendTransaction(tx, {
        onSuccess: () => {
          setSuccess(true);
          setShowSuccess(true);
          try {
            onPurchased();
          } catch {}
        },
        onError: (err: unknown) => {
          const anyErr = err as any;
          const message =
            anyErr?.reason ||
            anyErr?.shortMessage ||
            anyErr?.message ||
            "Failed";
          if (/Only user/i.test(String(message))) {
            setError("Only USER role can buy. Choose role in Auth page.");
          } else if (/insufficient/i.test(String(message))) {
            setError("Insufficient funds for gas or price.");
          } else if (/sold out/i.test(String(message))) {
            setError("Tickets are sold out.");
          } else {
            setError(`Purchase failed: ${String(message)}`);
          }
        },
      });
    } catch (e) {
      setError("Failed to initiate transaction.");
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-semibold">Purchase Successful!</h3>
        <p className="text-sm text-muted-foreground">
          Your NFT ticket has been minted. Check your tickets tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Confirmation Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Ticket Purchased
            </DialogTitle>
            <DialogDescription>
              Your ticket for {event.name} has been minted successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Event on {new Date(event.date * 1000).toLocaleString()} at{" "}
            {event.location}.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSuccess(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Event:</span>
          <span className="font-medium">{event.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Date & Time:</span>
          <span className="font-medium">
            {new Date(event.date * 1000).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Location:</span>
          <span className="font-medium">{event.location}</span>
        </div>
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="font-medium">
            {Number(event.ticketPriceWei) / 1e18} ETH
          </span>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button className="w-full" onClick={onBuy} disabled={isPending}>
        {isPending ? (
          <span className="inline-flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Purchasing...
          </span>
        ) : (
          "Confirm & Mint"
        )}
      </Button>
      {isPending && (
        <p className="text-xs text-muted-foreground text-center">
          Please confirm the transaction in your wallet and wait for
          confirmation...
        </p>
      )}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue="john@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <Input defaultValue="0x1234...5678" readOnly />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to be notified about events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Event Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified before your events
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Events</p>
              <p className="text-sm text-muted-foreground">
                Discover new events in your area
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
