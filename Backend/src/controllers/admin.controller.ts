import { Response } from "express";
import prisma from '../config/prisma';
import { KYCStatus, Role } from '@prisma/client';
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * [MODULE] Admin Controller
 * ------------------------
 * Purpose: Administrative management for regulators and platform oversight.
 */

export const getAdminOverview = async (req: AuthRequest, res: Response) => {
    // Logic updated to filter out rejected regulators until resubmission
    try {
        const [
            regulatorQueue,
            totalUsers,
            totalProperties,
            totalValuation,
            allUsers,
            allProperties,
            recentAuditLogs
        ] = await Promise.all([
            // Pending Regulators: Inactive users with regulator role who are not rejected OR have resubmitted
            prisma.user.findMany({
                where: { 
                    role: Role.regulator, 
                    is_active: false,
                    AND: [
                        { OR: [{ rejection_reason: null }, { rejection_reason: "" }, { is_resubmitted: true }] },
                        // Ensure we aren't showing someone who was rejected but the reason was accidentally cleared
                        // (Usually reason is null or string, but we want to be safe)
                    ]
                },
                select: { 
                    user_id: true, 
                    name: true, 
                    email: true, 
                    role: true, 
                    created_at: true, 
                    cnic: true, 
                    dob: true,
                    is_resubmitted: true,
                    rejection_reason: true 
                }
            }),
            prisma.user.count(),
            prisma.property.count(),
            prisma.property.aggregate({ _sum: { valuation: true } }),
            // User Directory: Everyone EXCEPT inactive regulators (who are in the onboarding queue)
            prisma.user.findMany({
                where: {
                    NOT: { role: Role.regulator, is_active: false }
                },
                select: { user_id: true, name: true, email: true, role: true, is_active: true, created_at: true },
                orderBy: { created_at: 'desc' },
                take: 100
            }),
            prisma.property.findMany({
                include: { owner: { select: { name: true } } },
                orderBy: { created_at: 'desc' },
                take: 100
            }),
            prisma.auditLog.findMany({
                include: { user: { select: { name: true } } },
                orderBy: { timestamp: 'desc' },
                take: 20
            })
        ]);

        res.json({
            queue: regulatorQueue,
            stats: {
                totalUsers,
                totalProperties,
                totalValuation: Number(totalValuation._sum.valuation || 0)
            },
            users: allUsers,
            properties: allProperties,
            logs: recentAuditLogs
        });
    } catch (error) {
        console.error("Admin Overview Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;
        const adminId = req.user?.user_id;

        if (!adminId) return res.status(401).json({ message: "Unauthorized" });

        const user = await prisma.user.findUnique({ where: { user_id: Number(userId) } });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Don't allow banning self or other admins (safety)
        if (user.role === Role.admin) {
            return res.status(403).json({ message: "Administrators cannot be deactivated" });
        }

        const updatedUser = await prisma.user.update({
            where: { user_id: Number(userId) },
            data: { is_active: !user.is_active }
        });

        await prisma.auditLog.create({
            data: {
                user_id: adminId,
                actorRole: 'ADMIN',
                module: 'USER_MGMT' as any,
                action: 'UPDATED',
                targetId: Number(userId),
                targetName: user.name,
                details: { status: updatedUser.is_active ? 'ENABLED' : 'DISABLED' }
            }
        });

        res.json({ 
            message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`,
            user: { user_id: updatedUser.user_id, is_active: updatedUser.is_active }
        });
    } catch (error) {
        console.error("Toggle User Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const approveRegulator = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.user_id;
        const { userId } = req.body;

        if (!adminId) return res.status(401).json({ message: "Unauthorized" });

        const candidate = await prisma.user.findUnique({
            where: { user_id: Number(userId) }
        });

        if (!candidate || candidate.role !== Role.regulator) {
            return res.status(404).json({ message: "Regulator candidate not found" });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { user_id: Number(userId) },
                data: { is_active: true }
            }),
            prisma.auditLog.create({
                data: {
                    user_id: adminId,
                    actorRole: 'ADMIN',
                    module: 'USER_MGMT' as any,
                    action: 'APPROVED',
                    targetId: Number(userId),
                    targetName: candidate.name,
                    details: { comments: 'Admin authorized regulator access' }
                }
            }),
            prisma.notification.create({
                data: {
                    user_id: Number(userId),
                    type: "verification",
                    message: "Your regulator account has been approved. You now have access to the regulator dashboard."
                }
            })
        ]);

        res.json({ message: "Regulator approved successfully" });
    } catch (error) {
        console.error("Approve Regulator Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const rejectRegulator = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.user_id;
        const { userId, reason } = req.body;

        if (!adminId) return res.status(401).json({ message: "Unauthorized" });

        const candidate = await prisma.user.findUnique({
            where: { user_id: Number(userId) }
        });

        if (!candidate || candidate.role !== Role.regulator) {
            return res.status(404).json({ message: "Regulator candidate not found" });
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { user_id: Number(userId) },
                data: { 
                    is_active: false, 
                    rejection_reason: reason,
                    is_resubmitted: false // Reset resubmitted flag on new rejection
                }
            }),
            prisma.auditLog.create({
                data: {
                    user_id: adminId,
                    actorRole: 'ADMIN',
                    module: 'USER_MGMT' as any,
                    action: 'REJECTED',
                    targetId: Number(userId),
                    targetName: candidate.name,
                    details: { reason, note: 'Regulator registration rejected' }
                }
            })
        ]);

        res.json({ message: "Regulator rejected successfully" });
    } catch (error) {
        console.error("Reject Regulator Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
