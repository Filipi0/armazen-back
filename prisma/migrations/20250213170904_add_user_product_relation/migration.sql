-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "idUser" INTEGER,
ALTER COLUMN "idAdmin" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
