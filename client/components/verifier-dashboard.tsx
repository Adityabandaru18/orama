"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
const ConnectButtonDynamic = dynamic(
  () => import("thirdweb/react").then((m) => m.ConnectButton),
  { ssr: false }
);
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareContractCall, readContract } from "thirdweb";
import { contract, client } from "@/lib/thirdweb";
import { sepolia } from "thirdweb/chains";
import { DialogClose } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

// No dummy data; everything is live

export function VerifierDashboard() {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "valid" | "invalid" | "used";
    ticketId?: string;
    eventName?: string;
    attendeeName?: string;
    seat?: string;
    reason?: string;
  } | null>(null);
  const [manualTicketId, setManualTicketId] = useState("");
  const [successModal, setSuccessModal] = useState(false);
  const [failureModal, setFailureModal] = useState<{
    open: boolean;
    reason?: string;
  }>({ open: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const detectorRef = useRef<any>(null);

  const shortAddr = useMemo(() => {
    const a = account?.address;
    return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "Not connected";
  }, [account?.address]);

  const startScanning = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      // In a real app, this would access the camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Try native BarcodeDetector for QR codes
      const BD: any = (globalThis as any).BarcodeDetector;
      if (BD) {
        try {
          detectorRef.current = new BD({ formats: ["qr_code"] });
        } catch {
          detectorRef.current = null;
        }
      }

      if (detectorRef.current && videoRef.current) {
        // Poll detection periodically
        const tick = async () => {
          if (!detectorRef.current || !videoRef.current) return;
          try {
            const results = await detectorRef.current.detect(videoRef.current);
            if (Array.isArray(results) && results.length > 0) {
              const raw =
                (results[0] && (results[0].rawValue || results[0].rawValue)) ||
                "";
              if (raw) {
                await handleDetectedText(String(raw));
                stopScanning();
                return;
              }
            }
          } catch {}
        };
        // Use a modest interval to reduce CPU
        scanIntervalRef.current = window.setInterval(tick, 500);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      setIsScanning(false);
    }
  };

  // Role guard: verifier only
  useEffect(() => {
    let cancelled = false;
    async function guard() {
      if (!account?.address) return;
      try {
        const role: any = await readContract({
          contract,
          method: "function VERIFIER_ROLE() view returns (bytes32)",
          params: [],
        });
        const ok: any = await readContract({
          contract,
          method: "function hasRole(bytes32,address) view returns (bool)",
          params: [role, account.address],
        });
        if (!cancelled && !ok) {
          try {
            alert("Access denied for this wallet");
          } catch {}
          router.replace("/");
        }
      } catch {
        // on read failure, be conservative
      }
    }
    guard();
    return () => {
      cancelled = true;
    };
  }, [account?.address, router]);

  const stopScanning = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const parseQrPayload = (qr: string) => {
    // Expected format: ETKT|e=<eventId>|b=<buyer>|ts=...|exp=...
    const parts = Object.fromEntries(
      qr
        .split("|")
        .slice(1)
        .map((kv) => {
          const [k, v] = kv.split("=");
          return [k, v];
        })
    ) as Record<string, string>;
    return {
      eventId: parts["e"] ? Number(parts["e"]) : undefined,
      buyer: parts["b"],
    };
  };

  const decodeTicketCode = (raw: string): number | null => {
    const s = raw.trim().toUpperCase();
    if (/^ED[A-Z0-9]+$/.test(s)) {
      const body = s.slice(2);
      const n = parseInt(body, 36);
      return Number.isFinite(n) ? n : null;
    }
    if (/^[0-9]+$/.test(s)) {
      return Number(s);
    }
    return null;
  };

  const formatTicketCode = (ticketId: number): string => {
    const base = ticketId.toString(36).toUpperCase();
    return `ED${base.padStart(6, "0")}`;
  };

  const extractTicketIdFromQrText = (raw: string): number | null => {
    const s = String(raw).trim();
    // Direct numeric
    if (/^[0-9]+$/.test(s)) return Number(s);
    // ED code
    const ed = decodeTicketCode(s);
    if (ed !== null) return ed;
    // ETKT payloads
    if (s.startsWith("ETKT")) {
      // Prefer tid=
      const tidMatch = s.match(/(?:\||^)tid=([0-9]+)/i);
      if (tidMatch && tidMatch[1]) {
        const n = Number(tidMatch[1]);
        return Number.isFinite(n) ? n : null;
      }
    }
    return null;
  };

  const resolveTicketIdFromEventAndBuyer = async (
    eventId: number,
    buyer: string
  ): Promise<number | null> => {
    try {
      // get buyer tickets
      const tickets: any = await readContract({
        contract,
        method: "function getTicketsOf(address user) view returns (uint256[])",
        params: [buyer],
      });
      const ids: number[] = Array.isArray(tickets)
        ? tickets.map((x: any) => Number(x))
        : [];
      if (!ids.length) return null;
      // find first matching unused ticket for event
      for (const id of ids) {
        const evId: any = await readContract({
          contract,
          method: "function ticketToEvent(uint256) view returns (uint256)",
          params: [BigInt(id)],
        });
        if (Number(evId) !== Number(eventId)) continue;
        const used: any = await readContract({
          contract,
          method: "function checkTicketUsed(uint256 ticketId) view returns (bool)",
          params: [BigInt(id)],
        });
        if (Boolean(used)) continue;
        return id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDetectedText = async (text: string) => {
    const raw = String(text).trim().toUpperCase();
    // 1) If the QR already contains a friendly code, keep it as-is
    if (/^ED[A-Z0-9]+$/.test(raw)) {
      setManualTicketId(raw);
      return;
    }
    // 2) Try to extract a numeric ticketId and convert to friendly code
    const directId = extractTicketIdFromQrText(raw);
    if (directId !== null) {
      setManualTicketId(formatTicketCode(Number(directId)));
      return;
    }
    // 3) Fallback: legacy ETKT payload with event+buyer
    if (text.startsWith("ETKT")) {
      const { eventId, buyer } = parseQrPayload(text);
      if (eventId && buyer) {
        const resolved = await resolveTicketIdFromEventAndBuyer(eventId, buyer);
        if (resolved !== null) {
          setManualTicketId(formatTicketCode(Number(resolved)));
          return;
        }
      }
    }
    // 4) Invalid
    setFailureModal({ open: true, reason: "The ticket is invalid" });
  };

  const verifyOnChain = async (ticketIdNum: number) => {
    try {
      // Check event start time
      const evIdRaw: any = await readContract({
        contract,
        method: "function ticketToEvent(uint256) view returns (uint256)",
        params: [BigInt(ticketIdNum)],
      });
      const ev: any = await readContract({
        contract,
        method:
          "function getEvent(uint256 eventId) view returns ((uint256 id, string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, uint256 ticketsSold, string imageUrl))",
        params: [BigInt(evIdRaw)],
      });
      const nowSec = Math.floor(Date.now() / 1000);
      const eventStart = Number(
        typeof ev?.date === "bigint" ? Number(ev.date) : ev?.date
      );
      if (Number.isFinite(eventStart) && nowSec < eventStart) {
        setScanResult({
          status: "invalid",
          ticketId: String(ticketIdNum),
          reason: "Event not started yet",
        });
        return;
      }

      // Check used
      const isUsed: any = await readContract({
        contract,
        method:
          "function checkTicketUsed(uint256 ticketId) view returns (bool)",
        params: [BigInt(ticketIdNum)],
      });
      if (Boolean(isUsed)) {
        setScanResult({
          status: "used",
          ticketId: String(ticketIdNum),
          reason: "Ticket already used",
        });
        setFailureModal({ open: true, reason: "Ticket already used" });
        return;
      }

      const tx = prepareContractCall({
        contract,
        method: "function verifyTicket(uint256 ticketId)",
        params: [BigInt(ticketIdNum)],
      });
      sendTransaction(tx, {
        onSuccess: async () => {
          setSuccessModal(true);
          setScanResult({ status: "valid", ticketId: String(ticketIdNum) });
        },
        onError: () => {
          setScanResult({
            status: "invalid",
            ticketId: String(ticketIdNum),
            reason: "Verification failed",
          });
          setFailureModal({ open: true, reason: "Verification failed" });
        },
      });
    } catch {
      setScanResult({
        status: "invalid",
        ticketId: String(ticketIdNum),
        reason: "Verification failed",
      });
      setFailureModal({ open: true, reason: "Verification failed" });
    }
  };

  const resolveTicketFromQrAndVerify = async (qr: string) => {
    const { eventId, buyer } = parseQrPayload(qr);
    if (!eventId || !buyer) {
      setScanResult({ status: "invalid", reason: "Invalid QR payload" });
      return;
    }
    try {
      // Check event time before enumerating tickets
      const ev: any = await readContract({
        contract,
        method:
          "function getEvent(uint256 eventId) view returns ((uint256 id, string name, string location, string description, uint256 date, uint256 time, uint256 ticketSupply, uint256 ticketPrice, uint256 ticketsSold, string imageUrl))",
        params: [BigInt(eventId)],
      });
      const nowSec = Math.floor(Date.now() / 1000);
      const eventStart = Number(
        typeof ev?.date === "bigint" ? Number(ev.date) : ev?.date
      );
      if (Number.isFinite(eventStart) && nowSec < eventStart) {
        setScanResult({ status: "invalid", reason: "Event not started yet" });
        setFailureModal({ open: true, reason: "Event not started yet" });
        return;
      }

      // get buyer tickets
      let tickets: any = await readContract({
        contract,
        method: "function getTicketsOf(address user) view returns (uint256[])",
        params: [buyer],
      });
      const ids: number[] = Array.isArray(tickets)
        ? tickets.map((x: any) => Number(x))
        : [];
      if (!ids.length) {
        setScanResult({ status: "invalid", reason: "No tickets for buyer" });
        setFailureModal({ open: true, reason: "No tickets for buyer" });
        return;
      }
      // find first matching ticket for event and not used
      for (const id of ids) {
        const evId: any = await readContract({
          contract,
          method: "function ticketToEvent(uint256) view returns (uint256)",
          params: [BigInt(id)],
        });
        if (Number(evId) !== Number(eventId)) continue;
        const used: any = await readContract({
          contract,
          method:
            "function checkTicketUsed(uint256 ticketId) view returns (bool)",
          params: [BigInt(id)],
        });
        if (Boolean(used)) continue;
        await verifyOnChain(id);
        return;
      }
      setScanResult({ status: "invalid", reason: "No valid ticket found" });
      setFailureModal({ open: true, reason: "No valid ticket found" });
    } catch {
      setScanResult({ status: "invalid", reason: "Failed to resolve ticket" });
      setFailureModal({ open: true, reason: "Failed to resolve ticket" });
    }
  };

  const handleManualVerify = async () => {
    const raw = manualTicketId.trim();
    if (!raw) return;
    const idNum = decodeTicketCode(raw);
    if (idNum === null) {
      setScanResult({
        status: "invalid",
        ticketId: raw,
        reason: "Enter a valid Ticket Code (ED...) or numeric ticket ID",
      });
      return;
    }
    await verifyOnChain(Number(idNum));
    setManualTicketId("");
  };

  // No stats/history

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">ORAMA Verifier</h1>
                <p className="text-xs text-muted-foreground">
                  Ticket Validation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {shortAddr}
              </span>
              <ConnectButtonDynamic
                client={client}
                chain={sepolia}
                connectModal={{ size: "compact" }}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="bg-transparent">
                    Sign Out
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign Out</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to sign out?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => router.replace("/")}
                    >
                      Sign Out
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* QR Scanner */}
        <Card className="max-w-xl mx-auto w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Scan tickets to verify authenticity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {isScanning ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                      Scanning for QR code...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Camera className="w-16 h-16 mb-4" />
                  <p className="text-sm text-center">
                    Tap scan to start camera
                  </p>
                </div>
              )}
            </div>

            {/* Scan Controls */}
            <div className="flex gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={startScanning}
                disabled={isScanning}
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Scan
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={stopScanning}
                disabled={!isScanning}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Stop Scan
              </Button>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Manual Ticket ID Entry</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Ticket Code (ED...) or numeric ID"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleManualVerify}
                  disabled={!manualTicketId.trim() || isPending}
                >
                  Verify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minimal feedback handled via modals */}

        {/* Success Modal */}
        <Dialog open={successModal} onOpenChange={setSuccessModal}>
          <DialogContent className="max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogHeader>
              <DialogTitle>Ticket Verified</DialogTitle>
              <DialogDescription>
                Ticket successfully verified on-chain.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => setSuccessModal(false)}>
              Close
            </Button>
          </DialogContent>
        </Dialog>

        {/* Failure Modal */}
        <Dialog
          open={failureModal.open}
          onOpenChange={(o) => setFailureModal({ open: o })}
        >
          <DialogContent className="max-w-sm text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle>Verification Failed</DialogTitle>
              <DialogDescription>
                {failureModal.reason || "Invalid ticket"}
              </DialogDescription>
            </DialogHeader>
            <Button
              className="w-full"
              onClick={() => setFailureModal({ open: false })}
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>

        {/* No history section */}
      </div>
    </div>
  );
}

function ScanResultDisplay({
  result,
}: {
  result: {
    status: "valid" | "invalid" | "used";
    ticketId?: string;
    eventName?: string;
    attendeeName?: string;
    seat?: string;
    reason?: string;
  };
}) {
  const isValid = result.status === "valid";
  const isUsed = result.status === "used";

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-center space-x-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isValid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isValid ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
        </div>
        <div>
          <h3
            className={`text-lg font-bold ${
              isValid ? "text-green-600" : "text-red-600"
            }`}
          >
            {isValid
              ? "Ticket verified"
              : isUsed
              ? "Ticket already used"
              : "Invalid ticket"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Ticket ID: {result.ticketId}
          </p>
        </div>
      </div>

      {/* No extra details on success per requirements */}

      {/* Error Details */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {result.reason || "This ticket could not be verified."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
