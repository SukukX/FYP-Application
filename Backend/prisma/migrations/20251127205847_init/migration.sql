-- CreateEnum
CREATE TYPE "Role" AS ENUM ('guest', 'investor', 'owner', 'admin', 'regulator');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('not_submitted', 'pending', 'approved', 'rejected', 'needs_revision');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('residential', 'commercial', 'industrial');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'live', 'sold_out', 'suspended');

-- CreateEnum
CREATE TYPE "VerificationStatusDoc" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "SukukStatus" AS ENUM ('active', 'matured', 'redeemed');

-- CreateEnum
CREATE TYPE "VerificationStatusLog" AS ENUM ('approved', 'rejected', 'needs_revision');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('buy', 'sell', 'profit_payout', 'redeem', 'wallet_fund');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('approved', 'pending', 'violated');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('verification', 'profit', 'transaction', 'system', 'security');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'investor',
    "phone_number" VARCHAR(15),
    "country" VARCHAR(100),
    "address" VARCHAR(256),
    "dob" DATE,
    "profile_pic" VARCHAR(256),
    "cnic" VARCHAR(15),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "wallet_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_address" VARCHAR(256) NOT NULL,
    "chain_id" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "mfa_settings" (
    "mfa_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "secret" VARCHAR(256),
    "backup_codes" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_settings_pkey" PRIMARY KEY ("mfa_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "kyc_requests" (
    "kyc_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cnic_number" VARCHAR(15) NOT NULL,
    "cnic_front" VARCHAR(256) NOT NULL,
    "cnic_back" VARCHAR(256) NOT NULL,
    "cnic_expiry" DATE NOT NULL,
    "face_scan" VARCHAR(256),
    "status" "KYCStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "kyc_requests_pkey" PRIMARY KEY ("kyc_id")
);

-- CreateTable
CREATE TABLE "properties" (
    "property_id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "location" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "property_type" "PropertyType" NOT NULL,
    "valuation" DECIMAL(15,2) NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'draft',
    "image_folder_path" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("property_id")
);

-- CreateTable
CREATE TABLE "documents" (
    "document_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "file_hash" VARCHAR(256) NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_path" VARCHAR(256) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" INTEGER,
    "verification_status" "VerificationStatusDoc" NOT NULL DEFAULT 'pending',

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "sukuks" (
    "sukuk_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "available_tokens" INTEGER NOT NULL,
    "token_price" DECIMAL(15,4) NOT NULL,
    "yield_percent" DECIMAL(5,2),
    "maturity_date" DATE,
    "blockchain_hash" VARCHAR(256),
    "status" "SukukStatus" NOT NULL DEFAULT 'active',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sukuks_pkey" PRIMARY KEY ("sukuk_id")
);

-- CreateTable
CREATE TABLE "investments" (
    "investment_id" SERIAL NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "tokens_owned" INTEGER NOT NULL,
    "purchase_value" DECIMAL(15,2) NOT NULL,
    "tx_hash" VARCHAR(256),
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("investment_id")
);

-- CreateTable
CREATE TABLE "profit_distributions" (
    "distribution_id" SERIAL NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "tx_hash" VARCHAR(256) NOT NULL,
    "distributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profit_distributions_pkey" PRIMARY KEY ("distribution_id")
);

-- CreateTable
CREATE TABLE "verification_logs" (
    "log_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "regulator_id" INTEGER NOT NULL,
    "status" "VerificationStatusLog" NOT NULL,
    "comments" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "transaction_logs" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sukuk_id" INTEGER,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "tx_hash" VARCHAR(256),
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_logs_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "compliance_id" SERIAL NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "rule_applied" VARCHAR(256) NOT NULL,
    "verified_by" INTEGER NOT NULL,
    "compliance_status" "ComplianceStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("compliance_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(256) NOT NULL,
    "details" TEXT,
    "ip_address" VARCHAR(50),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cnic_key" ON "users"("cnic");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_wallet_address_key" ON "wallets"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_settings_user_id_key" ON "mfa_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_requests_user_id_key" ON "kyc_requests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_requests_cnic_number_key" ON "kyc_requests"("cnic_number");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_settings" ADD CONSTRAINT "mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sukuks" ADD CONSTRAINT "sukuks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_regulator_id_fkey" FOREIGN KEY ("regulator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
