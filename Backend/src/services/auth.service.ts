import { PrismaClient, User, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
    async register(data: any) {
        const { name, email, password, role, phone_number, cnic } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error("User already exists");
        }

        if (cnic) {
            const existingCnic = await prisma.user.findUnique({ where: { cnic } });
            if (existingCnic) {
                throw new Error("CNIC already exists");
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role as Role,
                phone_number,
                cnic, // Assuming CNIC is provided at registration or handled later
            },
        });

        return this.generateToken(user);
    }

    async login(data: any) {
        const { email, password } = data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid credentials");
        }

        return this.generateToken(user);
    }

    private generateToken(user: User) {
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        return { user, token };
    }
}
