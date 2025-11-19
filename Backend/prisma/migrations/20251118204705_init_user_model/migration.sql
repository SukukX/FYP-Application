-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'investor', 'regulator');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'investor',
    "wallet_address" VARCHAR(256),
    "cnic" VARCHAR(15) NOT NULL,
    "phone_number" VARCHAR(15),
    "address" VARCHAR(256),
    "dob" DATE,
    "profile_pic" VARCHAR(256),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cnic_key" ON "users"("cnic");
