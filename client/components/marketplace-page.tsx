"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Ticket,
  Calendar,
  MapPin,
  Search,
  Filter,
  Wallet,
  User,
  TrendingUp,
  TrendingDown,
  Shield,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

const mockListings = [
  {
    id: "LISTING-001",
    ticketId: "NFT-001",
    eventName: "Tech Conference 2024",
    eventDate: "2024-03-15",
    eventTime: "09:00 AM",
    location: "San Francisco, CA",
    venue: "Moscone Center",
    originalPrice: "0.1 ETH",
    listingPrice: "0.12 ETH",
    priceChange: "+20%",
    seller: {
      address: "0x1234...5678",
      username: "TechEnthusiast",
      verified: true,
      rating: 4.8,
      sales: 12,
    },
    listedDate: "2024-03-10",
    seat: "A-15",
    image: "/tech-conference-stage.jpg",
    category: "Technology",
    status: "available",
  },
  {
    id: "LISTING-002",
    ticketId: "NFT-002",
    eventName: "Music Festival",
    eventDate: "2024-04-20",
    eventTime: "06:00 PM",
    location: "Austin, TX",
    venue: "Zilker Park",
    originalPrice: "0.25 ETH",
    listingPrice: "0.22 ETH",
    priceChange: "-12%",
    seller: {
      address: "0x5678...9012",
      username: "MusicLover",
      verified: true,
      rating: 4.9,
      sales: 8,
    },
    listedDate: "2024-03-12",
    seat: "GA",
    image: "/music-festival-crowd.jpg",
    category: "Music",
    status: "available",
  },
  {
    id: "LISTING-003",
    ticketId: "NFT-003",
    eventName: "Art Exhibition",
    eventDate: "2024-05-10",
    eventTime: "02:00 PM",
    location: "New York, NY",
    venue: "MoMA",
    originalPrice: "0.05 ETH",
    listingPrice: "0.08 ETH",
    priceChange: "+60%",
    seller: {
      address: "0x9012...3456",
      username: "ArtCollector",
      verified: false,
      rating: 4.2,
      sales: 3,
    },
    listedDate: "2024-03-08",
    seat: "General",
    image: "/modern-art-gallery.jpg",
    category: "Art",
    status: "available",
  },
  {
    id: "LISTING-004",
    ticketId: "NFT-004",
    eventName: "Blockchain Summit 2024",
    eventDate: "2024-06-15",
    eventTime: "10:00 AM",
    location: "Miami, FL",
    venue: "Convention Center",
    originalPrice: "0.15 ETH",
    listingPrice: "0.18 ETH",
    priceChange: "+20%",
    seller: {
      address: "0x3456...7890",
      username: "CryptoTrader",
      verified: true,
      rating: 4.7,
      sales: 25,
    },
    listedDate: "2024-03-11",
    seat: "VIP-5",
    image: "/blockchain-conference.png",
    category: "Technology",
    status: "sold",
  },
]

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredListings = mockListings
    .filter((listing) => {
      const matchesSearch = listing.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || listing.category.toLowerCase() === selectedCategory
      const isAvailable = listing.status === "available"
      return matchesSearch && matchesCategory && isAvailable
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number.parseFloat(a.listingPrice.split(" ")[0]) - Number.parseFloat(b.listingPrice.split(" ")[0])
        case "price-high":
          return Number.parseFloat(b.listingPrice.split(" ")[0]) - Number.parseFloat(a.listingPrice.split(" ")[0])
        case "date":
          return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        default:
          return new Date(b.listedDate).getTime() - new Date(a.listedDate).getTime()
      }
    })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeft className="w-5 h-5" />
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">ORAMA</span>
              </Link>
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">Resale Marketplace</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                My Dashboard
              </Link>
              <Button size="sm">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">NFT Ticket Marketplace</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buy and sell authentic NFT event tickets securely on the blockchain
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">247</div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">1,429</div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">45.7 ETH</div>
              <p className="text-sm text-muted-foreground">Volume (24h)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">0.15 ETH</div>
              <p className="text-sm text-muted-foreground">Avg Price</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="date">Event Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ListingCard({ listing }: { listing: (typeof mockListings)[0] }) {
  const isPriceUp = listing.priceChange.startsWith("+")

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative">
        <img src={listing.image || "/placeholder.svg"} alt={listing.eventName} className="w-full h-full object-cover" />
        <Badge variant="outline" className="absolute top-2 left-2 bg-background/90">
          {listing.category}
        </Badge>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {isPriceUp ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-xs font-medium ${isPriceUp ? "text-green-600" : "text-red-600"}`}>
            {listing.priceChange}
          </span>
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{listing.eventName}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            {listing.eventDate} at {listing.eventTime}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            {listing.venue}, {listing.location}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price Info */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-primary">{listing.listingPrice}</p>
              <p className="text-sm text-muted-foreground">Original: {listing.originalPrice}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Seat</p>
              <p className="font-medium">{listing.seat}</p>
            </div>
          </div>

          {/* Seller Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{listing.seller.username}</p>
                  {listing.seller.verified && <Shield className="w-3 h-3 text-green-600" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {listing.seller.sales} sales • {listing.seller.rating}★
                </p>
              </div>
            </div>
          </div>

          {/* Buy Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                Buy Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase NFT Ticket</DialogTitle>
                <DialogDescription>Complete your purchase to transfer the NFT ticket to your wallet</DialogDescription>
              </DialogHeader>
              <PurchaseDialog listing={listing} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

function PurchaseDialog({ listing }: { listing: (typeof mockListings)[0] }) {
  const [step, setStep] = useState(1)

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber}
            </div>
            {stepNumber < 3 && <div className="w-12 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Review Purchase</h3>
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span>Event:</span>
              <span className="font-medium">{listing.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium">{listing.eventDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Seat:</span>
              <span className="font-medium">{listing.seat}</span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-medium">{listing.listingPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (2.5%):</span>
              <span className="font-medium">
                {(Number.parseFloat(listing.listingPrice.split(" ")[0]) * 0.025).toFixed(3)} ETH
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>{(Number.parseFloat(listing.listingPrice.split(" ")[0]) * 1.025).toFixed(3)} ETH</span>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Seller Information</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium">{listing.seller.username}</p>
                    {listing.seller.verified && <Shield className="w-3 h-3 text-green-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{listing.seller.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{listing.seller.rating}★</p>
                <p className="text-xs text-muted-foreground">{listing.seller.sales} sales</p>
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={() => setStep(2)}>
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Connect Wallet & Pay</h3>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your payment will be held in escrow until the ticket transfer is confirmed on the blockchain.
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => setStep(3)}>
            <Wallet className="w-4 h-4 mr-2" />
            Pay with MetaMask
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-semibold">Purchase Successful!</h3>
          <p className="text-sm text-muted-foreground">
            The NFT ticket has been transferred to your wallet. You can view it in your dashboard.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" asChild>
              <Link href="/dashboard">View My Tickets</Link>
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Etherscan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
