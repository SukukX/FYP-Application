# Smart Sukuk Platform — Complete Knowledge Base

## Platform Overview

Smart Sukuk is a comprehensive real estate tokenization platform that enables fractional ownership of properties through blockchain technology. The platform connects property owners, investors, and regulators in a seamless ecosystem, enabling transparent, Shariah-compliant investment in real estate assets.

The platform tokenizes real estate properties into digital sukuk tokens. Property owners can list their properties, which get verified by regulators, and then tokenized on a blockchain. Investors can then buy fractional shares (tokens) of these properties. The platform handles the entire lifecycle from property listing to token trading and rent distribution.

### Key Features
- Fractional real estate ownership through blockchain tokens
- Role-based access for users, regulators, and admins
- KYC (Know Your Customer) verification for compliance
- Primary marketplace for initial token offerings
- Secondary exchange for peer-to-peer token trading
- Automated rent distribution to token holders
- Multi-factor authentication (MFA/2FA) for security
- Blockchain-backed transparency and immutability

---

## User Roles and Permissions

### Regular User (Investor / Owner)
A regular user can act as both a property owner and an investor. There is no separate role for owners vs investors — any user can perform both actions.

**As an Owner:**
- List properties on the platform
- Upload property images and legal documents
- Submit properties for regulatory verification
- Manage listing status (go live, hide)
- Submit rent payments for distribution
- Sell owned tokens on the secondary exchange

**As an Investor:**
- Browse the marketplace for investment opportunities
- Buy tokens from the primary market
- Trade tokens on the secondary exchange
- View portfolio and track performance
- Receive rent distributions proportional to token holdings

**Requirements:**
- Must complete KYC verification before trading
- Must connect a blockchain wallet before tokenization

### Regulator
Regulators are responsible for compliance and due diligence on the platform.

**Capabilities:**
- Review and process KYC verification requests
- Approve or reject property listings
- Add remarks and upload proof documents during verification
- View audit logs for all regulatory actions
- Revalue properties (update token prices)

**Onboarding:**
- Register with role set to "regulator"
- Account starts as inactive
- Must be approved by an admin before accessing the regulator dashboard
- If rejected, can reapply by submitting again

### Admin
Administrators have full platform oversight and management capabilities.

**Capabilities:**
- Approve or reject regulator onboarding applications
- Activate or deactivate any user account
- View platform-wide statistics (total users, properties, valuations)
- Manage the user directory
- Approve rent distributions submitted by owners
- View audit logs

---

## Registration and Login

### How to Register
1.  **Navigate to the [Registration Page](/auth/register)**.
2.  **Select Your Role**:
    *   **User (Investor / Property Owner)**: For individuals looking to buy tokens or list properties.
    *   **Regulator**: For regulatory bodies (requires admin approval).
3.  **Fill in Required Fields**:
    *   **Full Name**
    *   **Email Address**
    *   **Phone Number** (formatted like +92 300 1234567)
    *   **Date of Birth**
    *   **CNIC Number** (formatted as 42101-1234567-1)
    *   **Password** (Security requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
4.  **Submit Form**: Your account will be created immediately.

> [!NOTE]
> Document uploads (KYC) happen **after** registration, not during.

### How to Log In
1.  Go to the **[Login Page](/auth/login)**.
2.  Enter your email and password.
3.  **MFA Check**: If Multi-Factor Authentication is enabled, enter the 6-digit code from your authenticator app.
4.  Redirect to your **[Dashboard](/dashboard)**.

---

## KYC Verification (Identity Verification)

### What is KYC?
KYC (Know Your Customer) is a mandatory identity verification process. You **cannot trade tokens** or list properties until your KYC is approved by a regulator.

### How to Submit KYC
After registering and logging in:
1.  Open the **[KYC Wizard](/dashboard)** (usually appears as a prompt or can be found in your profile).
2.  **CNIC Number & Expiry**: Verify your CNIC and enter the expiry date.
3.  **Upload Documents**:
    *   **CNIC Front**: Clear photo of the front of your ID card.
    *   **CNIC Back**: Clear photo of the back of your ID card.
    *   **Liveness Face Scan** (Optional): A selfie or camera scan to verify you are the owner of the document.
4.  **OCR Verification**: The system will automatically check if the name/number on the ID matches your registration details.
5.  **Submit**: Your status will change to **Pending**.

### KYC Statuses
*   **Not Submitted**: No verification started.
*   **Pending**: Waiting for regulator review.
*   **Approved**: Verified! You can now access the **[Marketplace](/marketplace)** and **[Exchange](/exchange)**.
*   **Rejected**: Check the rejection reason in your dashboard and resubmit.

### Important
*   Each CNIC number can only be registered once.
*   KYC approval automatically whitelists your wallet for blockchain transactions.

---

## Property Listing (For Owners)

### How to List a Property
1.  Go to your **[Dashboard](/dashboard)**.
2.  Select the **My Properties** tab in the center of the screen.
3.  Click the **Create Listing** button.
3.  Fill in the property details:
   - **Title**: Name of the property
   - **Location**: Full address of the property
   - **Description**: Detailed description of the property
   - **Property Type**: Choose from Residential, Commercial, or Industrial
   - **Valuation**: Total monetary value of the property (in PKR)
   - **Total Tokens**: How many tokens to create for this property
   - **Tokens for Sale**: How many tokens to offer to investors (rest are retained by owner)
4. Upload property images (multiple images supported)
5. Upload legal documents (title deed, tax receipts, etc.)
6. You can either:
   - **Save as Draft**: Save without submitting for review (status: "draft")
   - **Submit for Verification**: Send to regulators for review (status: "pending")

### Property Verification Status
- **Draft**: Saved but not yet submitted
- **Pending**: Submitted and waiting for regulator review
- **Approved**: Verified by regulator — ready for tokenization and listing
- **Rejected**: Rejected by regulator — check the remarks and resubmit

### Tokenization Process
When a regulator approves a property:
1. The property is automatically converted into digital shares (tokens) on the blockchain.
2. The owner receives their retained tokens as inventory.
3. The remaining tokens become available for investors to purchase.
4. The tokenized structure is activated and ready for the marketplace.

### Going Live on the Marketplace
After approval:
1. Go to your property in the owner dashboard
2. Click "Go Live" to change listing status to "Active"
3. The property now appears in the marketplace for investors to browse
4. You can "Hide" the listing to remove it from marketplace (only if no tokens have been sold)

### Editing a Property
- You can edit draft properties freely
- After submission, changes require a new submission
- After approval, price/valuation changes must be requested through the regulator

### Deleting a Property
- You can delete a property only if no tokens have been sold to investors
- If tokens are sold, the property cannot be deleted — you can only hide the listing
- Deletion removes all associated documents, sukuks, and verification logs

---

## Marketplace (Browsing and Investing)

### How to Browse the Marketplace
1. Navigate to the Marketplace page at [Marketplace](/marketplace)
2. Browse available properties — only approved and active listings are shown
3. Use filters to narrow results:
   - **Location**: Search by area/city
   - **Property Type**: Filter by Residential, Commercial, or Industrial
   - **Price Range**: Set minimum and maximum valuation
4. Click on a property card to view full details

### Property Details Page
When you click on a property, you can see:
- Property images and description
- Location and property type
- Total valuation
- Token information: total tokens, available tokens, sold tokens, price per token
- Legal documents (downloadable)
- Price history chart
- Regulator comments/remarks

### How to Buy Tokens (Primary Market)
1. Make sure your KYC is approved
2. Make sure you have connected a blockchain wallet
3. Ensure you have sufficient fiat balance in your account
4. Browse the marketplace and select a property
5. Enter the number of tokens you want to buy
6. Confirm the purchase
7. Tokens are transferred to your wallet on the blockchain
8. Your fiat balance is deducted accordingly
9. The transaction is logged in your transaction history

### Important Notes
- Token price is calculated as: Property Valuation ÷ Total Tokens
- You must be KYC verified to buy tokens
- You must have a connected blockchain wallet
- You need sufficient fiat balance (shown on your dashboard/portfolio) as wallet balance
- Each purchase is recorded as a blockchain transaction

---

## Secondary Exchange (Peer-to-Peer Trading)

### What is the Secondary Exchange?
The secondary exchange allows token holders to sell their tokens to other investors at a price they set. It's like a mini stock exchange for property tokens.

### How to List Tokens for Sale
1. Go to the Dashboard page at [Dashboard](/dashboard)
2. On the dashboard, switch to the **My Properties** tab.
3. Look for your Active Investments.
4. For any property, click the **List on Exchange** button.
4. Enter the number of tokens you want to sell
5. Set your asking price per token
6. Set the listing duration (default: 30 days)
7. Click "Create Listing"
8. Your tokens are now available for other investors to buy

### Listing Rules
- You can only list tokens you own
- You cannot list more tokens than you have available (unlocked)
- If you already have open listings for the same property, those locked tokens are subtracted from your available amount
- Listings automatically expire after the set duration
- You can cancel an open listing at any time

### How to Buy from the Exchange
1. Go to the Exchange page at [Exchange](/exchange)
2. Browse available listings
3. Each listing shows: property name, seller, price per token, available tokens, expiry date
4. Select a listing and enter how many tokens you want to buy
5. Confirm the purchase

### Trading Rules
- You cannot buy your own listing
- Both buyer and seller must be KYC verified
- Both must have connected blockchain wallets
- Buyer must have sufficient fiat balance
- Partial buys are supported (you can buy fewer tokens than listed)
- When all tokens in a listing are sold, it's marked as "Completed"

---

## Portfolio Management

### Viewing Your Portfolio
1. Navigate to the Dashboard page at [Dashboard](/dashboard)
2. Click the **Portfolio** link or navigate directly to [Dashboard Portfolio](/dashboard/portfolio).
3. View your investment summary:
   - **Total Investment Value**: Current value of all holdings
   - **Total Tokens Held**: Sum of all tokens across properties
   - **Properties Invested In**: Number of distinct properties
   - **Total Yield Earned**: Cumulative rent/profit distributions received
3. View portfolio breakdown by property type (Residential, Commercial, Industrial) in a pie chart
4. View individual holdings with detailed metrics

### Holding Details
For each investment, you can see:
- Property name and location
- Property type and image
- Number of tokens owned
- Price per token (current)
- Purchase value (what you paid)
- Current value (current market value)
- Profit/Loss amount and percentage
- Tokens listed on secondary exchange
- Purchase date

### Important
- Portfolio only shows investments in properties you do NOT own
- Owner inventory (tokens you retain as a property owner) is tracked separately in the owner dashboard
- Profit/Loss is calculated as: Current Value - Purchase Value

---

## Dashboard

### User Dashboard (Owner + Investor)
The dashboard at [Dashboard](/dashboard) is a unified view that shows both owner and investor data.

**My Properties Section:**
- Active Listings summary
- Tokens Sold vs Available
- Total Revenue from sales
- Pending Approvals count
- All your properties with their status
- Rejected properties with rejection reasons
- Access to "List on Exchange" for your holdings

**Investor Section:**
- Total Investment value
- Total Tokens held
- Properties you have invested in
- Total Yield Earned (Rent distributions)
- Portfolio composition chart
- Individual holding cards with P&L metrics

**Common Elements:**
- KYC status alert (prompts to complete if not done)
- MFA security alert (prompts to enable 2FA)
- Wallet address display
- Wallet balance display

### Regulator Dashboard
Available at [Dashboard](/dashboard/regulator) for approved regulators.

**Statistics:**
- Pending KYC requests count
- Pending Property listings count
- Total Users
- Approved Users
- Active Sukuks
- Approved Listings

**Work Queues:**
- **KYC Queue**: Pending KYC applications to review, with resubmission flags
- **Listing Queue**: Pending property submissions to verify, with documents and resubmission indicators

### Admin Dashboard
Available at [Dashboard](/dashboard)/admin for administrators.

**Platform Statistics:**
- Total Users
- Total Properties
- Total Platform Valuation

**Management Features:**
- Regulator Onboarding Queue: Approve or reject regulator applications
- User Directory: View and manage all users
- Property Directory: View all properties
- Audit Logs: View recent platform actions
- Pending Rents: View and approve rent distributions

---

## Rent Distribution

### How Rent Distribution Works
When a property generates rental income, it is distributed proportionally to all token holders.

### Submitting Rent (Property Owner)
1. Go to your owner dashboard
2. Select the property that generated rent income
3. Enter the rent details:
   - **Amount**: Total rent collected (in PKR)
   - **Period Start**: Start date of the rental period
   - **Period End**: End date of the rental period (automatically set to 1 month after start)
4. Submit the rent record
5. The rent is now pending admin approval

### Approving and Distributing Rent (Admin)
1. Go to the admin dashboard
2. Find the pending rent in the "Pending Rents" section
3. Review the rent details
4. Click "Distribute" to approve
5. The system automatically:
   - Calculates each investor's share based on their token holdings
   - Creates profit distribution records for each investor
   - Logs the transaction
   - Marks the rent as distributed

### Rent Calculation
- Distribution Rate = Total Rent Amount ÷ Total Tokens Held by All Investors
- Each Investor's Share = Their Token Count × Distribution Rate
- The owner's own retained tokens also receive distributions

### Important
- Only admins can approve rent distributions
- A rent can only be distributed once (idempotency protection)
- Period end must be after period start
- The payment is recorded with the property, amount, and date

---

## Wallet Management

### Connecting a Wallet
1. Go to your dashboard
2. Click "Connect Wallet" in the wallet section
3. Enter your Ethereum wallet address (must start with 0x and be 42 characters)
4. The wallet is linked to your account
5. If your KYC is already approved, the wallet is automatically whitelisted on the blockchain

### Wallet Rules
- Each wallet address can only be linked to one account
- Each user should have one primary wallet
- The wallet must be a valid Ethereum address format (0x followed by 40 hex characters)
- Wallet whitelisting on the blockchain is required for token transactions

### Disconnecting a Wallet
1. Go to your dashboard
2. Click "Disconnect Wallet"
3. The wallet is unlinked from your account
4. Note: This does not move your tokens — they remain in the wallet on the blockchain

### Fiat Balance
- The balance is used for buying tokens
- When you buy tokens, your balance decreases
- When you sell tokens, your balance increases
- The balance is displayed on your dashboard

---

## Profile Management

### Viewing Your Profile
1. Go to the Profile page at [Dashboard](/dashboard)/profile
2. View your personal information: name, email, phone, country, address, date of birth

### Updating Your Profile
1. Navigate to Profile
2. Edit fields: Name, Phone Number, Country, Address, Date of Birth
3. Save changes

### Uploading an Avatar
1. Go to your Profile
2. Click on your avatar/profile picture
3. Upload a new image
4. The image is stored in Cloudinary and linked to your account

### Changing Your Password
1. Go to Profile or Settings
2. Enter your current password
3. Enter your new password
4. Confirm the change

---

## Security — Multi-Factor Authentication (MFA / 2FA)

### What is MFA?
Multi-Factor Authentication adds an extra layer of security to your account. After enabling it, you'll need both your password and a time-based one-time code from an authenticator app to log in.

### How to Enable MFA
1. Go to your Dashboard or Profile settings
2. Click "Enable 2FA" or "Setup MFA"
3. A QR code will be displayed on screen
4. Open your authenticator app (Google Authenticator, Authy, etc.)
5. Scan the QR code with your authenticator app
6. Enter the 6-digit code shown in the authenticator app
7. If the code is verified, MFA is enabled on your account

### How MFA Works During Login
1. Enter your email and password as usual
2. If MFA is enabled, you'll be prompted for a verification code
3. Open your authenticator app and enter the current 6-digit code
4. If the code matches, you're logged in

### Disabling MFA
1. Go to your security settings
2. Click "Disable MFA"
3. MFA is turned off — only password is required for future logins

---

## Account Deactivation and Deletion

### Deactivating Your Account
- Deactivation makes your account inactive but doesn't delete it
- You cannot deactivate if you have properties with external investors (investor protection)
- All your sessions are invalidated upon deactivation
- To reactivate, contact support

### Deleting Your Account (Permanent)
- This is irreversible — all personal data is permanently removed
- Requires password verification
- If MFA is enabled, requires MFA code as well
- Cannot delete if you have properties with active external investors
- Cascading deletion removes: investments, wallets, sessions, and related records
- Audit logs and verification logs persist (with user reference set to null) for compliance

---

## Property Revaluation

### What is Revaluation?
Regulators can update the total valuation of a property, which automatically recalculates the token price.

### How it Works
1. A regulator navigates to the property details
2. Enters a new valuation amount
3. Provides remarks/justification for the change
4. The system calculates: New Token Price = New Valuation ÷ Total Tokens
5. The property valuation is updated
6. The sukuk token price is updated
7. A price history record is created (shown in charts)

### Impact
- All existing token holders see their investment value change
- The price history chart on the marketplace updates
- This affects portfolio valuations for all investors

---

## Notifications

The platform sends automated notifications for key events:
- **KYC Approved**: "Your KYC verification has been APPROVED. You can now invest in properties."
- **KYC Rejected**: "Your KYC verification was REJECTED. Reason: [reason]"
- **Regulator Approved**: "Your regulator account has been approved."
- **Transaction**: Notifications for token purchases and sales
- **System**: General platform announcements

Notifications appear in the dashboard and can be marked as read.

---

## Frequently Asked Questions (FAQ)

### General
**Q: What is Smart Sukuk?**
A: Smart Sukuk is a real estate tokenization platform that lets you invest in properties through blockchain-based fractional ownership tokens.

**Q: Is Smart Sukuk Shariah-compliant?**
A: Yes, the platform is designed with Shariah compliance in mind. Sukuk tokens represent real asset ownership, not debt instruments.

**Q: What currency does the platform use?**
A: The platform uses Pakistani Rupees (PKR) for all fiat transactions.

### Account & KYC
**Q: Why do I need KYC verification?**
A: KYC is required by financial regulations to verify your identity before you can trade tokens. It helps prevent fraud and money laundering.

**Q: How long does KYC verification take?**
A: KYC verification is processed by our regulators. Typically it takes 1-3 business days, but can vary depending on the queue.

**Q: My KYC was rejected. What should I do?**
A: Check the rejection reason provided, update your documents as needed, and resubmit. Common reasons include blurry images, expired CNIC, or mismatched information.

### Investing
**Q: How much does it cost to buy tokens?**
A: Token price is calculated as Property Valuation divided by Total Tokens. Each property has different pricing.

**Q: Is there a minimum investment?**
A: You need to buy at least 1 token. The minimum cost depends on the token price of the specific property.

**Q: Can I sell my tokens anytime?**
A: Yes, you can list your tokens for sale on the secondary exchange at any time. However, a buyer needs to purchase them for the sale to complete.

**Q: How do I receive rent income?**
A: When a property owner submits rent and an admin approves distribution, your share is automatically credited based on how many tokens you hold.

### Property Owners
**Q: How do I list my property?**
A: Go to your owner dashboard, click "Create New Listing", fill in details, upload documents, and submit for verification.

**Q: What documents do I need?**
A: You need property images and legal documents (title deed, tax receipts, etc.). Upload them during the listing creation process.

**Q: What happens after I submit my property?**
A: A regulator reviews your submission. They may approve it (triggers tokenization) or reject it with remarks for you to fix.

**Q: Can I set how many tokens to sell?**
A: Yes, when creating a listing, you specify "Total Tokens" and "Tokens for Sale". The difference is your retained ownership.

### Security
**Q: How do I enable 2FA?**
A: Go to your security settings, click "Enable 2FA", scan the QR code with an authenticator app, and verify with the code.

**Q: I lost access to my authenticator app. What do I do?**
A: Contact platform support for account recovery assistance.

### Wallet
**Q: What type of wallet do I need?**
A: You need an Ethereum-compatible wallet like MetaMask. The wallet address must start with 0x.

**Q: Do I need cryptocurrency to use the platform?**
A: No, the platform handles token transactions internally. You use your fiat (PKR) balance to buy tokens. The blockchain is used for transparency and immutability.

---

## Technical Information

### Blockchain
- The platform uses a secure, transparent blockchain for all transactions.
- Tokens represent legal fractional ownership of real estate assets.
- Operations like transfers and rent distributions are recorded immutably.

### Security
- Passwords are hashed with bcrypt
- Authentication uses JWT tokens
- CORS protection is enabled
- Helmet security headers are applied
- File uploads go through Cloudinary (secure cloud storage)
- MFA uses TOTP (Time-based One-Time Password) via Speakeasy

### Data Privacy
- User data is stored securely in PostgreSQL
- Profile pictures and documents are stored in Cloudinary
- When accounts are deleted, personal data is removed but audit logs persist for compliance
