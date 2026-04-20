import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const regulators = await prisma.user.findMany({
        where: { role: 'regulator' },
        select: {
            user_id: true,
            name: true,
            email: true,
            is_active: true,
            rejection_reason: true,
            is_resubmitted: true
        }
    });
    console.log(JSON.stringify(regulators, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
