-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "file_path" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "kyc_requests" ALTER COLUMN "cnic_front" SET DATA TYPE TEXT,
ALTER COLUMN "cnic_back" SET DATA TYPE TEXT,
ALTER COLUMN "face_scan" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "image_folder_path" SET DATA TYPE TEXT;
