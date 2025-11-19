-- CreateEnum
CREATE TYPE "VerificationStatusDoc" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "SukukStatus" AS ENUM ('active', 'matured', 'redeemed');

-- CreateEnum
CREATE TYPE "VerificationStatusLog" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('buy', 'sell', 'profit', 'redeem');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('approved', 'pending', 'violated');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('verification', 'profit', 'transaction', 'system');

-- CreateTable
CREATE TABLE "documents" (
    "document_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "file_hash" VARCHAR(256) NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" INTEGER,
    "verification_status" "VerificationStatusDoc" NOT NULL DEFAULT 'pending',
    "file_path" VARCHAR(256) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "sukuks" (
    "sukuk_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "token_price" DECIMAL(10,2) NOT NULL,
    "roi_percent" DECIMAL(5,2),
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
    "purchase_value" DECIMAL(10,2) NOT NULL,
    "tx_hash" VARCHAR(256),
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("investment_id")
);

-- CreateTable
CREATE TABLE "profit_distributions" (
    "distribution_id" SERIAL NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "tx_hash" VARCHAR(256) NOT NULL,
    "distributed_at" TIMESTAMP(3),

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
    "sukuk_id" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "tx_hash" VARCHAR(256),
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
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

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
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
