import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold text-primary mb-2 animate-fade-in">Terms & Conditions</h1>
                    <p className="text-muted-foreground mb-8">Last updated: April 8, 2025</p>

                    <Card className="animate-slide-up">
                        <CardContent className="p-8 space-y-6 prose prose-sm max-w-none">
                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">1. Introduction</h2>
                                <p className="text-muted-foreground">
                                    Welcome to Smart Sukuk, a tokenized real estate investment platform operating under Shariah-compliant principles. By accessing or using our platform, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">2. Security Token (ERC-1400) Framework</h2>
                                <p className="text-muted-foreground mb-3">
                                    Smart Sukuk utilizes ERC-1400 security tokens representing fractional ownership in real estate assets. These tokens:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Represent legal ownership rights in underlying real estate properties</li>
                                    <li>Are subject to transfer restrictions and regulatory compliance requirements</li>
                                    <li>Include partition-based controls for compliance with securities regulations</li>
                                    <li>Maintain on-chain documentation and audit trails</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">3. Eligibility & KYC Requirements</h2>
                                <p className="text-muted-foreground mb-3">
                                    To participate in token transactions, users must:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Be at least 18 years of age</li>
                                    <li>Hold valid Pakistani citizenship or authorized residency</li>
                                    <li>Complete NADRA-verified KYC authentication</li>
                                    <li>Provide biometric verification (fingerprint and live selfie)</li>
                                    <li>Be whitelisted by the Regulator Node before trading</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">4. Investor Obligations</h2>
                                <p className="text-muted-foreground">
                                    Investors acknowledge that token purchases involve risk and agree to conduct their own due diligence. Token values may fluctuate, and past performance does not guarantee future returns. Investors are responsible for understanding tax implications and maintaining compliance with applicable regulations.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">5. Property Owner Obligations</h2>
                                <p className="text-muted-foreground mb-3">
                                    Property owners listing assets on Smart Sukuk must:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                    <li>Hold clear and unencumbered title to the property</li>
                                    <li>Provide accurate valuation reports from certified assessors</li>
                                    <li>Maintain property tax compliance and provide FBR clearance</li>
                                    <li>Submit all required legal documentation for regulatory review</li>
                                    <li>Disclose all material facts and potential liabilities</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">6. Regulatory Oversight</h2>
                                <p className="text-muted-foreground">
                                    The platform operates under the supervision of authorized Regulator Nodes responsible for KYC verification (NADRA) and property approval (FBR). All listings must receive regulatory approval before becoming active. The Regulator Node maintains authority to whitelist/blacklist addresses and enforce compliance measures.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">7. Transaction Fees & Costs</h2>
                                <p className="text-muted-foreground">
                                    Token purchases incur platform fees (2% of transaction value) and blockchain gas fees. Fees are clearly disclosed before transaction confirmation. Additional costs may include custody fees, withdrawal fees, and regulatory compliance charges.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">8. Liability & Disclaimers</h2>
                                <p className="text-muted-foreground">
                                    Smart Sukuk provides a platform for tokenized real estate transactions but does not guarantee investment returns, property valuations, or regulatory outcomes. Users engage in transactions at their own risk. The platform is not liable for losses arising from market fluctuations, regulatory changes, or force majeure events.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">9. Data Privacy & Security</h2>
                                <p className="text-muted-foreground">
                                    User data, including KYC documents and biometric information, is encrypted and stored securely. Personal information is shared only with authorized regulatory bodies as required by law. Users retain rights to access, modify, and request deletion of their personal data subject to legal retention requirements.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">10. Dispute Resolution</h2>
                                <p className="text-muted-foreground">
                                    Disputes arising from platform use will be resolved through arbitration in accordance with Pakistani law. Users agree to jurisdiction in Islamabad, Pakistan for legal proceedings.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">11. Amendments</h2>
                                <p className="text-muted-foreground">
                                    Smart Sukuk reserves the right to modify these Terms and Conditions at any time. Users will be notified of material changes and continued use constitutes acceptance of updated terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-primary mb-3">Contact Information</h2>
                                <p className="text-muted-foreground">
                                    For questions regarding these Terms and Conditions, please contact our compliance team at compliance@smartsukuk.com or +92 300 0000000.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
