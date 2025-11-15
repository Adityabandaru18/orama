"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import dynamic from "next/dynamic";
const ConnectButtonDynamic = dynamic(
  () => import("thirdweb/react").then((m) => m.ConnectButton),
  { ssr: false }
);
import { prepareContractCall } from "thirdweb";
import { contract, client } from "@/lib/thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sepolia } from "thirdweb/chains";

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "farcaster",
        "email",
        "x",
        "phone",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export default function AuthPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const [selectedRole, setSelectedRole] = useState("");
  const [existingRole, setExistingRole] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  // ====== CONTRACT READS ======
  const { data: adminAddress } = useReadContract({
    contract,
    method: "function admin() view returns (address)",
    params: [],
  });

  const { data: userRole } = useReadContract({
    contract,
    method: "function USER_ROLE() view returns (bytes32)",
    params: [],
  });

  const { data: verifierRole } = useReadContract({
    contract,
    method: "function VERIFIER_ROLE() view returns (bytes32)",
    params: [],
  });

  const [hasUserRole, setHasUserRole] = useState<boolean>(false);
  const [hasVerifierRole, setHasVerifierRole] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function checkRoles() {
      if (!account || !userRole || !verifierRole) return;
      try {
        const [u, v] = await Promise.all([
          Promise.race([
            import("thirdweb").then(({ readContract }) =>
              readContract({
                contract,
                method: "function hasRole(bytes32,address) view returns (bool)",
                params: [userRole, account.address],
              })
            ),
            new Promise((_, r) =>
              setTimeout(() => r(new Error("timeout")), 5000)
            ),
          ]),
          Promise.race([
            import("thirdweb").then(({ readContract }) =>
              readContract({
                contract,
                method: "function hasRole(bytes32,address) view returns (bool)",
                params: [verifierRole, account.address],
              })
            ),
            new Promise((_, r) =>
              setTimeout(() => r(new Error("timeout")), 5000)
            ),
          ]),
        ]);
        if (!cancelled) {
          setHasUserRole(Boolean(u));
          setHasVerifierRole(Boolean(v));
        }
      } catch {
        if (!cancelled) {
          setHasUserRole(false);
          setHasVerifierRole(false);
        }
      }
    }
    checkRoles();
    return () => {
      cancelled = true;
    };
  }, [account, userRole, verifierRole]);

  // ====== ROLE DETECTION ======
  useEffect(() => {
    if (!account || !adminAddress) return;

    const addr = account.address.toLowerCase();
    const adminAddr = adminAddress.toLowerCase();

    if (addr === adminAddr) setExistingRole("admin");
    else if (hasUserRole) setExistingRole("user");
    else if (hasVerifierRole) setExistingRole("verifier");
    else setExistingRole("");
  }, [account, adminAddress, hasUserRole, hasVerifierRole]);

  // ====== HANDLE LOGIN ======
  const handleLogin = async () => {
    if (!account) {
      setStatus({
        loading: false,
        error: "Please connect your wallet",
        success: "",
      });
      return;
    }
    if (!selectedRole) {
      setStatus({ loading: false, error: "Select a role", success: "" });
      return;
    }

    const addr = account.address.toLowerCase();
    const adminAddr = adminAddress?.toLowerCase();

    // Admin logic
    if (selectedRole === "admin") {
      if (addr === adminAddr) {
        router.push("/admin");
      } else {
        setStatus({
          loading: false,
          error: "Access denied: Only admin",
          success: "",
        });
      }
      return;
    }

    // Already has a different role
    if (existingRole && existingRole !== selectedRole) {
      setStatus({
        loading: false,
        error: `Access denied. You already have a different role: ${existingRole}`,
        success: "",
      });
      return;
    }

    // Already has correct role
    if (existingRole === selectedRole) {
      if (selectedRole === "user") {
        router.push(`/dashboard?wallet=${encodeURIComponent(addr)}`);
      } else {
        router.push(`/verify?wallet=${encodeURIComponent(addr)}`);
      }
      return;
    }

    // New user — assign role
    try {
      setStatus({
        loading: true,
        error: "",
        success: "Confirm transaction in wallet...",
      });
      const roleType = selectedRole === "user" ? 1 : 2;

      const tx = prepareContractCall({
        contract,
        method: "function selectRole(uint8 roleType)",
        params: [roleType],
      });

      sendTransaction(tx, {
        onSuccess: () => {
          setStatus({
            loading: false,
            error: "",
            success: "Role assigned! Redirecting...",
          });
          setTimeout(() => {
            if (selectedRole === "user") {
              router.push("/dashboard");
            } else {
              router.push("/verify");
            }
          }, 2000);
        },
        onError: (err) => {
          console.error(err);
          setStatus({
            loading: false,
            error: "Transaction failed",
            success: "",
          });
        },
      });
    } catch (e) {
      setStatus({ loading: false, error: "Unexpected error", success: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">ORAMA</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to ORAMA
          </h1>
          <p className="text-muted-foreground">
            Connect your wallet to continue
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 space-y-6">
          {/* Connect Wallet */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect Wallet</h3>
            <ConnectButtonDynamic
              client={client}
              chain={sepolia}
              connectModal={{ size: "compact" }}
              wallets={wallets}
            />
          </div>

          {/* Select Role */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Select Role</h3>
            <Select
              onValueChange={setSelectedRole}
              value={selectedRole}
              disabled={!account}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User - Attend Events</SelectItem>
                <SelectItem value="verifier">
                  Verifier - Check Tickets
                </SelectItem>
                <SelectItem value="admin">Admin - Organize Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Messages */}
          {status.error && (
            <div className="text-sm text-red-500">{status.error}</div>
          )}
          {status.success && (
            <div className="text-sm text-green-500">{status.success}</div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!account || !selectedRole || status.loading}
            className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-all ${
              account && selectedRole && !status.loading
                ? "bg-primary hover:bg-primary/90"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {status.loading
              ? "Verifying..."
              : `Continue as ${selectedRole || "Guest"}`}
          </button>
        </Card>
      </div>
    </div>
  );
}
