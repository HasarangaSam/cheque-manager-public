-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDING', 'CLEARED', 'BOUNCED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cheque" (
    "id" SERIAL NOT NULL,
    "chequeNumber" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ChequeStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "customerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cheque_customerId_idx" ON "Cheque"("customerId");

-- CreateIndex
CREATE INDEX "Cheque_dueDate_idx" ON "Cheque"("dueDate");

-- CreateIndex
CREATE INDEX "Cheque_status_idx" ON "Cheque"("status");

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
