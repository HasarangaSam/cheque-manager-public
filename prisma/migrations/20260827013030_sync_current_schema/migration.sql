/*
  Warnings:

  - You are about to drop the column `chequeDate` on the `Cheque` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cheque" DROP COLUMN "chequeDate";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");
