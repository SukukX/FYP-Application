-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_details" VARCHAR(256),
ADD COLUMN     "kyc_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "properties" (
    "property_id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "location" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "valuation" DECIMAL(15,2) NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_folder_path" VARCHAR(256) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("property_id")
);

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
