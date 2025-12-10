import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Document table schema...");
    // Query information schema directly
    const result = await prisma.$queryRaw`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_path';
  `;
    console.log("Result:", result);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
