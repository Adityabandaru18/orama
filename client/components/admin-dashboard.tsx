"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Users,
  Ticket,
  Plus,
  MapPin,
  DollarSign,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  useSendTransaction,
  useReadContract,
  useActiveAccount,
  useActiveWalletChain,
} from "thirdweb/react";
import dynamic from "next/dynamic";
const ConnectButtonDynamic = dynamic(
  () => import("thirdweb/react").then((m) => m.ConnectButton),
  { ssr: false }
);
import { contract, client } from "@/lib/thirdweb";
import { sepolia } from "thirdweb/chains";
import { useRouter } from "next/navigation";
import { uploadToPinata, toGatewayUrl } from "@/lib/pinata";
import { readContract, prepareContractCall } from "thirdweb";

// ----- TYPE DEFINITIONS -----
type EventType = {
  id: number;
  name: string;
  location: string;
  description: string;
  date: number; // unix timestamp (seconds)
  time: number; // unix timestamp (seconds)
  ticketSupply: number;
  ticketPrice: number;
  ticketsSold: number;
  imageUrl: string;
  revenue: string;
  totalTickets: number;
  status: string;
};

// ----- MAIN DASHBOARD -----
export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventsReloadKey, setEventsReloadKey] = useState(0);

  // Manual count (faster, with timeout control)
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(false);

  const readWithTimeout = async <T,>(
    promise: Promise<T>,
    ms = 5000
  ): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms)
      ),
    ]);
  };

  const refreshCounts = async () => {
    setIsLoadingCount(true);
    try {
      const count = await readWithTimeout(
        readContract({
          contract,
          method: "function getTotalEvents() view returns (uint256)",
          params: [],
        })
      );
      setTotalEvents(Number(count));
    } catch {
      // keep previous value on timeout/error
    }
    setIsLoadingCount(false);
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  // EVENTS STATE --
  const [events, setEvents] = useState<EventType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Fetch events from contract when count changes or reloadKey updates
  useEffect(() => {
    async function fetchEvents() {
      if (!totalEvents || isLoadingCount) {
        setEvents([]);
        return;
      }
      setIsLoadingEvents(true);

      const count = Number(totalEvents);
      const eventPromises: Promise<any>[] = [];
      for (let i = 1; i <= count; i++) {
        eventPromises.push(
          (async () => {
            return readContract({
              contract,
              method:
                "function getEvent(uint256 eventId) view returns ((uint256 id, string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, uint256 ticketsSold, string imageUrl))",
              params: [BigInt(i)],
            });
          })()
        );
      }
      try {
        const results = await Promise.all(eventPromises);

        const toNum = (v: any) =>
          typeof v === "bigint" ? Number(v.toString()) : Number(v);

        setEvents(
          results.map((event: any) => {
            const id = toNum(event.id);
            const ticketPriceEth = toNum(event.ticketPrice) / 1e18;
            const ticketsSold = toNum(event.ticketsSold);
            const ticketSupply = toNum(event.ticketSupply);
            return {
              id,
              name: event.name,
              location: event.location,
              description: event.description,
              date: toNum(event.date),
              time: toNum(event.time),
              ticketSupply,
              ticketPrice: ticketPriceEth,
              ticketsSold,
              imageUrl: event.imageUrl,
              revenue: (ticketPriceEth * ticketsSold).toFixed(3) + " ETH",
              totalTickets: ticketSupply,
              status: "active",
            } as EventType;
          })
        );
      } catch (err) {
        setEvents([]);
      }
      setIsLoadingEvents(false);
    }
    fetchEvents();
  }, [totalEvents, isLoadingCount, eventsReloadKey]);

  // // Periodic refresh and listen for cross-page purchase updates
  // useEffect(() => {
  //   const id = setInterval(() => {
  //     try {
  //       refreshCounts();
  //     } catch {}
  //     setEventsReloadKey((k) => k + 1);
  //   }, 15000);
  //   const handler = () => setEventsReloadKey((k) => k + 1);
  //   try {
  //     window.addEventListener("tickets:updated", handler);
  //   } catch {}

  //   return () => {
  //     clearInterval(id);
  //     try {
  //       window.removeEventListener("tickets:updated", handler);
  //     } catch {}
  //   };
  // }, []);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your events and track performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectButtonDynamic
                client={client}
                chain={sepolia}
                connectModal={{ size: "compact" }}
              />
              <Dialog
                open={isCreateEventOpen}
                onOpenChange={setIsCreateEventOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new event
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEventForm
                    onClose={() => setIsCreateEventOpen(false)}
                    onAfterCreate={async () => {
                      try {
                        await refreshCounts();
                      } catch {}
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview">
              <OverviewTab
                events={events}
                isLoading={isLoadingCount || isLoadingEvents}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// ----- OVERVIEW TAB -----
interface OverviewTabProps {
  events: EventType[];
  isLoading: boolean;
}
function OverviewTab({ events, isLoading }: OverviewTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  function openDetails(event: EventType) {
    setSelectedEvent(event);
    setDetailsOpen(true);
  }

  const fallbackImage =
    "https://source.unsplash.com/800x400/?event,concert,festival";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <>...</> : events.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <>...</>
              ) : (
                events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <>...</>
              ) : events.length === 0 ? (
                "0 ETH"
              ) : (
                events
                  .reduce(
                    (sum, e) =>
                      sum + Number(e.ticketPrice) * Number(e.ticketsSold),
                    0
                  )
                  .toFixed(3) + " ETH"
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Tickets
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <>...</>
              ) : (
                events.reduce(
                  (sum, e) => sum + Math.max(0, e.ticketSupply - e.ticketsSold),
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Events */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : events.length === 0
              ? "No events have been created yet."
              : "Browse and manage all your events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-muted-foreground text-center p-6">
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-muted-foreground text-center p-6">
                No recent events to show.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetails(event)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{event.revenue}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.ticketsSold}/{event.totalTickets} sold
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="p-0 overflow-hidden sm:max-w-6xl">
          {selectedEvent && (
            <div className="md:flex">
              <div className="md:w-1/2 bg-muted">
                <img
                  src={toGatewayUrl(selectedEvent.imageUrl) || fallbackImage}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover md:h-[520px]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackImage;
                  }}
                />
              </div>
              <div className="md:w-1/2 p-6 space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedEvent.name}
                  </h2>
                  <p className="text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {selectedEvent.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedEvent.date * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                    Price: {selectedEvent.ticketPrice} ETH
                  </span>
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                    Supply: {selectedEvent.ticketSupply}
                  </span>
                  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
                    Sold: {selectedEvent.ticketsSold}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----- TRANSACTIONS TAB -----
// (Removed) Transactions tab was deprecated per requirements
function TransactionsTab() {
  const [rows, setRows] = useState<
    {
      type: "purchase" | "verify";
      wallet: string;
      eventId?: string;
      ticketId?: string;
      txHash: string;
      blockNumber?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {}, []);

  return null;
}
// ----- CREATE EVENT FORM -----
interface CreateEventFormProps {
  onClose: () => void;
  onAfterCreate?: () => Promise<void> | void;
}
function CreateEventForm({ onClose, onAfterCreate }: CreateEventFormProps) {
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const router = useRouter();
  const { data: adminAddress } = useReadContract({
    contract,
    method: "function admin() view returns (address)",
    params: [],
  });
  const isAdmin = !!(
    account?.address &&
    adminAddress &&
    account.address.toLowerCase() === String(adminAddress).toLowerCase()
  );

  // Role guard for admin page
  useEffect(() => {
    if (!account?.address) return;
    if (!isAdmin) {
      try {
        alert("Access denied for this wallet");
      } catch {}
      router.replace("/");
    }
  }, [account?.address, isAdmin, router]);

  // Set random initial values for quick testing
  const [form, setForm] = useState({
    name: "Test Event " + Math.floor(Math.random() * 1000),
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
    fromTime: "10:00",
    toTime: "18:00",
    location: "Delhi, India",
    description: "A demo event {" + Math.floor(Math.random() * 10000) + "}",
    ticketSupply: String(50 + Math.floor(Math.random() * 100)),
    ticketPrice: (0.01 + Math.random()).toFixed(3),
    imageUrl: "https://source.unsplash.com/400x200/?event",
  });

  const [error, setError] = useState<string>("");
  const [txInProgress, setTxInProgress] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(form.imageUrl);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.id]: e.target.value });
    setError("");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const cid = await uploadToPinata(file);
      const ipfsUrl = `ipfs://${cid}`;
      setForm((prev) => ({ ...prev, imageUrl: ipfsUrl }));
      const gw = toGatewayUrl(ipfsUrl);
      if (gw) setImagePreviewUrl(gw);
    } catch (err) {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !form.name ||
      !form.date ||
      !form.fromTime ||
      !form.toTime ||
      !form.location ||
      !form.description ||
      !form.ticketSupply ||
      !form.ticketPrice
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setTxInProgress(true);

    try {
      if (!account) {
        setError("Please connect your wallet.");
        setTxInProgress(false);
        return;
      }

      if (!activeChain || activeChain.id !== sepolia.id) {
        setError("Please switch your wallet network to Sepolia.");
        setTxInProgress(false);
        return;
      }

      if (!contract?.address || String(contract.address).trim() === "") {
        setError(
          "Contract address is not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS."
        );
        setTxInProgress(false);
        return;
      }

      if (!isAdmin) {
        setError("Only the admin address can create events.");
        setTxInProgress(false);
        return;
      }

      const dateObj = new Date(`${form.date}T${form.fromTime}`);
      const eventTimestampSec = Math.floor(dateObj.getTime() / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!Number.isFinite(eventTimestampSec) || eventTimestampSec < nowSec) {
        setError("Event date/time must be today or later (future).");
        setTxInProgress(false);
        return;
      }
      const eventTimestamp = BigInt(eventTimestampSec);

      const toWei = (value: string): bigint => {
        const WEI_PER_ETH = BigInt("1000000000000000000");
        const [whole, frac = ""] = value.split(".");
        const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
        return BigInt(whole || "0") * WEI_PER_ETH + BigInt(fracPadded || "0");
      };

      const transaction = prepareContractCall({
        contract,
        method:
          "function createEvent(string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, string imageUrl)",
        params: [
          form.name,
          form.location,
          form.description,
          eventTimestamp,
          eventTimestamp,
          BigInt(form.ticketSupply),
          toWei(form.ticketPrice),
          form.imageUrl,
        ],
      });

      sendTransaction(transaction, {
        onSuccess: async () => {
          setTxInProgress(false);
          try {
            await onAfterCreate?.();
          } catch {}
          onClose();
        },
        onError: (err: unknown) => {
          const anyErr = err as any;
          const message =
            anyErr?.reason ||
            anyErr?.shortMessage ||
            anyErr?.message ||
            "Transaction failed.";
          const userRejected = /user rejected|user denied|rejected/i.test(
            String(message)
          );
          const onlyAdmin = /Only admin/i.test(String(message));
          const insufficient = /insufficient funds|max fee per gas/i.test(
            String(message)
          );
          const notSepolia =
            /chain|network/i.test(String(message)) &&
            !!activeChain &&
            activeChain.id !== sepolia.id;

          if (onlyAdmin) {
            setError("Only the admin can create events.");
          } else if (userRejected) {
            setError("Transaction rejected in wallet.");
          } else if (insufficient) {
            setError("Insufficient funds for gas on Sepolia.");
          } else if (notSepolia) {
            setError("Wrong network. Please switch to Sepolia.");
          } else {
            setError(`Transaction failed: ${String(message)}`);
          }
          try {
            console.error("CreateEvent error:", err);
          } catch {}
          setTxInProgress(false);
        },
      });
    } catch {
      setError(
        "Failed to create event. Verify details, wallet connection, and network."
      );
      setTxInProgress(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Event Name</Label>
          <Input
            id="name"
            placeholder="Enter event name"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Event Date</Label>
          <Input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromTime">From time:</Label>
          <Input
            id="fromTime"
            type="time"
            required
            value={form.fromTime}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toTime">To time:</Label>
          <Input
            id="toTime"
            type="time"
            required
            value={form.toTime}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter event location"
          required
          value={form.location}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your event"
          rows={3}
          value={form.description}
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticketSupply">Ticket Supply</Label>
          <Input
            id="ticketSupply"
            type="number"
            placeholder="Number of tickets"
            required
            value={form.ticketSupply}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticketPrice">Ticket Price (ETH)</Label>
          <Input
            id="ticketPrice"
            type="number"
            step="0.001"
            placeholder="0.1"
            required
            value={form.ticketPrice}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="pt-2">
          <Label htmlFor="imageUrl">Or paste image URL/IPFS</Label>
          <Input
            id="imageUrl"
            type="url"
            placeholder="ipfs://<cid> or https://..."
            value={form.imageUrl}
            onChange={(e) => {
              handleChange(e);
              const gw = toGatewayUrl(e.target.value);
              if (gw) setImagePreviewUrl(gw);
            }}
          />
        </div>
      </div>
      {!isAdmin && account && (
        <p className="text-sm text-red-500">
          Connected wallet is not the admin. Only admin can create events.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={txInProgress || isPending || !isAdmin}>
          {txInProgress ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
