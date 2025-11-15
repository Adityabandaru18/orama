"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  Users,
  CheckCircle,
  Calendar,
  MapPin,
  Ticket,
  Github,
  FileText,
  Mail,
  Twitter,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { readContract } from "thirdweb";
import { contract } from "@/lib/thirdweb";
import { toGatewayUrl } from "@/lib/pinata";

type ChainEvent = {
  id: number;
  name: string;
  location: string;
  description: string;
  date: number;
  time: number;
  ticketSupply: number;
  ticketPrice: number; // in ETH for display
  ticketsSold: number;
  imageUrl?: string;
};

export default function LandingPage() {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const total: any = await readContract({
          contract,
          method: "function getTotalEvents() view returns (uint256)",
          params: [],
        });
        const count = Number(total || 0);
        if (!count) {
          if (!cancelled) setEvents([]);
          setIsLoading(false);
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
        const mapped: ChainEvent[] = res.map((e: any) => ({
          id: toNum(e.id),
          name: e.name,
          location: e.location,
          description: e.description,
          date: toNum(e.date),
          time: toNum(e.time),
          ticketSupply: toNum(e.ticketSupply),
          ticketPrice: toNum(e.ticketPrice) / 1e18,
          ticketsSold: toNum(e.ticketsSold),
          imageUrl: e.imageUrl,
        }));
        const nowSec = Math.floor(Date.now() / 1000);
        const liveWindowSec = 60 * 60 * 6; // 6 hours window for "current"
        // Show current (live) + upcoming events
        const currentAndUpcoming = mapped.filter(
          (e) =>
            e.date >= nowSec ||
            (e.date <= nowSec && nowSec < e.date + liveWindowSec)
        );
        const latestThree = [...currentAndUpcoming]
          .sort((a, b) => a.date - b.date)
          .slice(0, 3);
        if (!cancelled) setEvents(latestThree);
      } catch (e) {
        if (!cancelled) setError("Failed to load events.");
      }
      setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">ORAMA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#events"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Events
              </Link>
              <Button asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              Powered by Blockchain Technology
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              Secure, Transparent,{" "}
              <span className="text-primary">NFT-Based</span> Event Ticketing
            </h1>
            <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
              Experience the future of event ticketing with blockchain-powered
              NFT tickets that eliminate fraud and ensure authentic ownership.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="#events">Explore Events</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth">Create Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ORAMA Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to secure, transparent event ticketing
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Create Event</h3>
              <p className="text-muted-foreground">
                Event organizers create events with details, pricing, and ticket
                supply on our platform.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Mint NFT Ticket</h3>
              <p className="text-muted-foreground">
                Attendees purchase tickets that are minted as unique NFTs on the
                blockchain for authenticity.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Verify at Entry</h3>
              <p className="text-muted-foreground">
                Event staff scan QR codes to instantly verify ticket
                authenticity and prevent fraud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Showcase */}
      <section id="events" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Events
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover upcoming events powered by ORAMA
            </p>
          </div>
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Loading events...
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No events available.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <Card
                  key={ev.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="bg-muted relative h-56 md:h-64 w-full">
                    {/* use img to avoid Next/Image domain config */}
                    <img
                      src={toGatewayUrl(ev.imageUrl) || "/placeholder.svg"}
                      alt={ev.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{ev.name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(ev.date * 1000).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {ev.location}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-primary">
                        {ev.ticketPrice} ETH
                      </span>
                      <Button size="sm" asChild>
                        <Link href="/auth">Login to buy</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose ORAMA?
            </h2>
            <p className="text-xl text-muted-foreground">
              Built on blockchain technology for maximum security and
              transparency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Fraud-Proof",
                description:
                  "Blockchain technology eliminates counterfeit tickets and ensures authenticity.",
              },
              {
                icon: Ticket,
                title: "NFT Ownership",
                description:
                  "True digital ownership with transferable NFT tickets stored in your wallet.",
              },
              {
                icon: CheckCircle,
                title: "Transparency",
                description:
                  "All transactions are recorded on the blockchain for complete transparency.",
              },
              {
                icon: Users,
                title: "Scalable",
                description:
                  "Built to handle events of any size, from intimate gatherings to massive festivals.",
              },
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Events?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join the future of event ticketing with ORAMA's blockchain-powered
              platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth">Get Started Today</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
        <p>
          &copy; 2024 ORAMA. All rights reserved. Built with blockchain
          technology.
        </p>
      </div>
    </div>
  );
}
