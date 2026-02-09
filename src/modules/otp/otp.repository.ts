// otp.repository.ts

import { prisma } from "../../config/prisma";


export class OtpRepository {
  create(data: {
    code: string;
    purpose: any;
    expiresAt: Date;
    userId?: string;
  }) {
    return prisma.oTP.create({ data });
  }

  findValidOtp(userId: string | undefined, purpose: any) {
    return prisma.oTP.findFirst({
      where: {
        userId,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  markVerified(id: string) {
    return prisma.oTP.update({
      where: { id },
      data: { verified: true },
    });
  }
}
