-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "idAdmin" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "supplier" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "UserAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
