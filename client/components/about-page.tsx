import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Zap,
  Users,
  CheckCircle,
  Ticket,
  ArrowLeft,
  Globe,
  Lock,
  TrendingUp,
  Award,
  Smartphone,
  Database,
} from "lucide-react"
import Link from "next/link"

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-4">
              <ArrowLeft className="w-5 h-5" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">ORAMA</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Button asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-6">
            About ORAMA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            The Future of <span className="text-primary">Event Ticketing</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            ORAMA revolutionizes event ticketing through blockchain technology, ensuring authenticity, transparency, and
            true digital ownership for every ticket.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16">
          <CardContent className="p-8 md:p-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To eliminate ticket fraud and create a transparent, secure ecosystem where event organizers, attendees,
                and verifiers can interact with complete confidence. We believe that blockchain technology can transform
                the ticketing industry by providing immutable proof of authenticity and enabling true digital ownership.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Core Features */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ORAMA?</h2>
            <p className="text-xl text-muted-foreground">
              Built on blockchain technology for maximum security and transparency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Fraud-Proof Security",
                description:
                  "Every ticket is an NFT on the blockchain, making counterfeiting impossible and ensuring complete authenticity.",
              },
              {
                icon: Ticket,
                title: "True Digital Ownership",
                description:
                  "Own your tickets as NFTs in your wallet. Transfer, resell, or keep them as digital collectibles.",
              },
              {
                icon: CheckCircle,
                title: "Complete Transparency",
                description:
                  "All transactions are recorded on the blockchain, providing full transparency and audit trails.",
              },
              {
                icon: Users,
                title: "Scalable Platform",
                description:
                  "Built to handle events of any size, from intimate gatherings to massive festivals and conferences.",
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

        {/* How It Works */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How ORAMA Works</h2>
            <p className="text-xl text-muted-foreground">Simple, secure, and transparent</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Event Creation</h3>
              <p className="text-muted-foreground">
                Event organizers create events on our platform, defining ticket supply, pricing, and event details. Each
                event is registered on the blockchain.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. NFT Ticket Minting</h3>
              <p className="text-muted-foreground">
                When users purchase tickets, unique NFTs are minted on the blockchain, ensuring each ticket is authentic
                and cannot be duplicated.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Instant Verification</h3>
              <p className="text-muted-foreground">
                At the event, verifiers scan QR codes to instantly validate tickets against the blockchain, preventing
                fraud and ensuring smooth entry.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl">Built on Cutting-Edge Technology</CardTitle>
            <CardDescription className="text-lg">
              ORAMA leverages the latest blockchain and web technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Ethereum Blockchain</h4>
                  <p className="text-sm text-muted-foreground">Secure, decentralized infrastructure</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">ERC-721 NFTs</h4>
                  <p className="text-sm text-muted-foreground">Industry-standard NFT protocol</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold">IPFS Storage</h4>
                  <p className="text-sm text-muted-foreground">Decentralized metadata storage</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Smart Contracts</h4>
                  <p className="text-sm text-muted-foreground">Automated, trustless transactions</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold">Web3 Integration</h4>
                  <p className="text-sm text-muted-foreground">Seamless wallet connectivity</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold">Mobile-First Design</h4>
                  <p className="text-sm text-muted-foreground">Optimized for all devices</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits for Different Users */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits for Everyone</h2>
            <p className="text-xl text-muted-foreground">ORAMA serves all stakeholders in the event ecosystem</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Event Organizers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Eliminate ticket fraud and counterfeiting
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Real-time analytics and sales tracking
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Automated revenue distribution
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Enhanced brand reputation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" />
                  Attendees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Guaranteed authentic tickets
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    True digital ownership as NFTs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Secure resale marketplace
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Collectible digital memorabilia
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Verifiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Instant ticket validation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Mobile-first verification tools
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Complete audit trail
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Reduced entry wait times
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Events?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the future of event ticketing with ORAMA's blockchain-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth">Get Started Today</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">Explore Platform</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
