/*
  Warnings:

  - The values [guest,investor,owner] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `action` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `details` column on the `audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('vacant', 'rented', 'owner_occupied');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('KYC', 'PROPERTY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'UPDATED');

-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('ADMIN', 'REGULATOR');

-- CreateEnum
CREATE TYPE "SecondaryListingStatus" AS ENUM ('open', 'completed', 'cancelled');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('user', 'admin', 'regulator');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actorRole" "ActorRole",
ADD COLUMN     "module" "AuditModule",
ADD COLUMN     "targetId" INTEGER,
ADD COLUMN     "targetName" VARCHAR(256),
DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL DEFAULT 'SUBMITTED',
DROP COLUMN "details",
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "file_type" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "occupancy_status" "OccupancyStatus" NOT NULL DEFAULT 'vacant';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fiat_balance" DECIMAL(15,2) NOT NULL DEFAULT 100000.00,
ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateTable
CREATE TABLE "rent_payments" (
    "rent_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "is_owner_occupied" BOOLEAN NOT NULL DEFAULT false,
    "distributed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("rent_id")
);

-- CreateTable
CREATE TABLE "token_price_history" (
    "history_id" SERIAL NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "old_price" DECIMAL(15,4) NOT NULL,
    "new_price" DECIMAL(15,4) NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "change_reason" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_price_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "listing_update_requests" (
    "request_id" SERIAL NOT NULL,
    "property_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "field_changed" VARCHAR(50) NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "justification" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_update_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "secondary_listings" (
    "listing_id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "sukuk_id" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "available_tokens" INTEGER NOT NULL,
    "price_per_token" DECIMAL(15,4) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "SecondaryListingStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_listings_pkey" PRIMARY KEY ("listing_id")
);

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_price_history" ADD CONSTRAINT "token_price_history_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_price_history" ADD CONSTRAINT "token_price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_update_requests" ADD CONSTRAINT "listing_update_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("property_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_update_requests" ADD CONSTRAINT "listing_update_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_update_requests" ADD CONSTRAINT "listing_update_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_listings" ADD CONSTRAINT "secondary_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_listings" ADD CONSTRAINT "secondary_listings_sukuk_id_fkey" FOREIGN KEY ("sukuk_id") REFERENCES "sukuks"("sukuk_id") ON DELETE RESTRICT ON UPDATE CASCADE;
