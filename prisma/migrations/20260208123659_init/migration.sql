-- DropIndex
DROP INDEX "Product_slug_key";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "slug" DROP NOT NULL,
ALTER COLUMN "discountPrice" SET DEFAULT 0,
ALTER COLUMN "price" SET DEFAULT 0;
