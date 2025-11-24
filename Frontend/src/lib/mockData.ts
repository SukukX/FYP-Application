// Mock data store with localStorage persistence
export const mockUsers = {
  investor: {
    id: "inv-001",
    role: "investor",
    username: "demo_investor",
    email: "investor@smartsukuk.com",
    dob: "1990-01-01",
    cnic: "42101-1234567-1",
    wallets: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"],
    bankAccounts: [{ type: "IBAN", value: "PK36SCBL0000001123456702" }],
    kycStatus: "verified",
    "2faEnabled": false,
  },
  owner: {
    id: "own-001",
    role: "owner",
    username: "demo_owner",
    email: "owner@smartsukuk.com",
    dob: "1985-05-15",
    cnic: "42201-9876543-2",
    wallets: ["0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"],
    bankAccounts: [{ type: "IBAN", value: "PK89MEZN0000001234567890" }],
    kycStatus: "verified",
    "2faEnabled": true,
  },
  regulator: {
    id: "reg-001",
    role: "regulator",
    username: "demo_regulator",
    email: "regulator@secp.gov.pk",
    dob: "1980-12-20",
    cnic: "42301-5555555-3",
    wallets: [],
    bankAccounts: [],
    kycStatus: "verified",
    "2faEnabled": true,
  },
};

export const mockListings = [
  {
    id: "1",
    ownerId: "own-001",
    title: "Premium Commercial Plaza - F-7 Islamabad",
    address: "F-7 Markaz, Islamabad",
    valuation: 50000000,
    totalTokens: 1000,
    tokensForSale: 400,
    tokensAvailable: 400,
    pricePerToken: 50000,
    tokenContract: "0x1234567890abcdef1234567890abcdef12345678",
    documents: [
      { type: "pdf", name: "Property Title", url: "/docs/title.pdf" },
      { type: "pdf", name: "Valuation Report", url: "/docs/valuation.pdf" },
    ],
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    ],
    status: "approved",
    regulatorComments: "Approved by FBR. All documents verified.",
    priceHistory: [
      { date: "2025-01-01", price: 48000 },
      { date: "2025-02-01", price: 49000 },
      { date: "2025-03-01", price: 49500 },
      { date: "2025-04-01", price: 50000 },
    ],
  },
  {
    id: "2",
    ownerId: "own-001",
    title: "Luxury Apartments - DHA Phase 5",
    address: "DHA Phase 5, Karachi",
    valuation: 75000000,
    totalTokens: 1500,
    tokensForSale: 600,
    tokensAvailable: 600,
    pricePerToken: 50000,
    tokenContract: "0xabcdef1234567890abcdef1234567890abcdef12",
    documents: [
      { type: "pdf", name: "Property Title", url: "/docs/title2.pdf" },
    ],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    ],
    status: "approved",
    regulatorComments: "Verified. Active trading.",
    priceHistory: [
      { date: "2025-01-01", price: 48500 },
      { date: "2025-02-01", price: 49200 },
      { date: "2025-03-01", price: 50000 },
      { date: "2025-04-01", price: 50000 },
    ],
  },
  {
    id: "3",
    ownerId: "own-001",
    title: "Tech Hub Office Building - Gulberg",
    address: "Gulberg III, Lahore",
    valuation: 100000000,
    totalTokens: 2000,
    tokensForSale: 800,
    tokensAvailable: 800,
    pricePerToken: 50000,
    tokenContract: "0x567890abcdef1234567890abcdef1234567890ab",
    documents: [
      { type: "pdf", name: "Commercial License", url: "/docs/license.pdf" },
    ],
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop",
    ],
    status: "approved",
    regulatorComments: "All checks passed.",
    priceHistory: [
      { date: "2025-01-01", price: 49000 },
      { date: "2025-02-01", price: 49800 },
      { date: "2025-03-01", price: 50000 },
      { date: "2025-04-01", price: 50000 },
    ],
  },
];

export const mockTransactions = [
  {
    id: "tx-001",
    listingId: "1",
    buyerId: "inv-001",
    sellerId: "own-001",
    numTokens: 50,
    pricePerToken: 50000,
    currency: "PKR",
    txHash: "0xabc123def456...",
    status: "confirmed",
    timestamp: "2025-04-01T10:30:00Z",
  },
  {
    id: "tx-002",
    listingId: "2",
    buyerId: "inv-001",
    sellerId: "own-001",
    numTokens: 30,
    pricePerToken: 50000,
    currency: "PKR",
    txHash: "0xdef456abc789...",
    status: "confirmed",
    timestamp: "2025-04-02T14:20:00Z",
  },
];

export const mockKYCQueue = [
  {
    userId: "user-pending-1",
    username: "ali_ahmed",
    email: "ali@example.com",
    cnic: "42101-1111111-1",
    dob: "1995-03-10",
    role: "investor",
    kycStatus: "pending",
    documents: [
      { type: "cnic_front", url: "/kyc/cnic_front.jpg" },
      { type: "cnic_back", url: "/kyc/cnic_back.jpg" },
      { type: "selfie", url: "/kyc/selfie.jpg" },
    ],
    submittedAt: "2025-04-05T09:00:00Z",
  },
  {
    userId: "user-pending-2",
    username: "sara_khan",
    email: "sara@example.com",
    cnic: "42201-2222222-2",
    dob: "1992-07-22",
    role: "owner",
    kycStatus: "pending",
    documents: [
      { type: "cnic_front", url: "/kyc/cnic_front2.jpg" },
      { type: "cnic_back", url: "/kyc/cnic_back2.jpg" },
    ],
    submittedAt: "2025-04-06T11:30:00Z",
  },
];

export const mockPendingListings = [
  {
    id: "pending-1",
    ownerId: "own-002",
    ownerName: "Hamza Malik",
    title: "Residential Complex - Bahria Town",
    address: "Bahria Town, Rawalpindi",
    valuation: 35000000,
    totalTokens: 700,
    tokensForSale: 280,
    pricePerToken: 50000,
    documents: [
      { type: "pdf", name: "Title Deed", url: "/docs/pending1.pdf" },
    ],
    images: [
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    ],
    status: "pending_verification",
    submittedAt: "2025-04-07T08:00:00Z",
  },
];

export const complianceContacts = [
  {
    name: "Muhammad Maaz Motiwala",
    role: "Chief Compliance Officer",
    phone: "+92 300 0000000",
    email: "maaz@smartsukuk.com",
  },
  {
    name: "Javeria Motiwala",
    role: "KYC Verification Lead",
    phone: "+92 300 0000001",
    email: "javeria@smartsukuk.com",
  },
  {
    name: "Muhammad Ahmed",
    role: "Regulatory Affairs Manager",
    phone: "+92 300 0000002",
    email: "ahmed@smartsukuk.com",
  },
];

// LocalStorage utilities
export const storage = {
  getUser: () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("smartsukuk_user");
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("smartsukuk_user", JSON.stringify(user));
  },
  clearUser: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("smartsukuk_user");
  },
  getPortfolio: (userId: string) => {
    if (typeof window === "undefined") return [];
    const portfolio = localStorage.getItem(`portfolio_${userId}`);
    return portfolio ? JSON.parse(portfolio) : [];
  },
  setPortfolio: (userId: string, holdings: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`portfolio_${userId}`, JSON.stringify(holdings));
  },
};
