/*
  Warnings:

  - The values [live,sold_out,suspended] on the enum `VerificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('hidden', 'active', 'sold_out', 'suspended');

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationStatus_new" AS ENUM ('draft', 'pending', 'approved', 'rejected');
ALTER TABLE "public"."properties" ALTER COLUMN "verification_status" DROP DEFAULT;
ALTER TABLE "properties" ALTER COLUMN "verification_status" TYPE "VerificationStatus_new" USING ("verification_status"::text::"VerificationStatus_new");
ALTER TYPE "VerificationStatus" RENAME TO "VerificationStatus_old";
ALTER TYPE "VerificationStatus_new" RENAME TO "VerificationStatus";
DROP TYPE "public"."VerificationStatus_old";
ALTER TABLE "properties" ALTER COLUMN "verification_status" SET DEFAULT 'draft';
COMMIT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "listing_status" "ListingStatus" NOT NULL DEFAULT 'hidden';
