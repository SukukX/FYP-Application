import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

/**
 * [SCRIPT] Seed Admin
 * -------------------
 * Ensures the default admin user exists for development/demo purposes.
 * Credentials: admin / admin
 */
const seedAdmin = async () => {
    try {
        const adminEmail = "admin";
        const adminPassword = "admin";

        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log("ℹ️  Default admin already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await prisma.user.create({
            data: {
                name: "System Administrator",
                email: adminEmail,
                password: hashedPassword,
                role: Role.admin,
                is_active: true
            }
        });

        console.log("✅  Default admin created (admin / admin)");
    } catch (error) {
        console.error("❌  Failed to seed admin:", error);
    }
};

export default seedAdmin;
