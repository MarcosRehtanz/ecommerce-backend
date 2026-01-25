/*
  Warnings:

  - A unique constraint covering the columns `[mercadoPagoId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "mercadoPagoId" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "orders_mercadoPagoId_key" ON "orders"("mercadoPagoId");
