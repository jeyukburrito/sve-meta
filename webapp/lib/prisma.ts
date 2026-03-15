import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// 서버리스(Vercel) 환경에서는 production이어도 global에 저장해야
// 같은 함수 인스턴스 내 재요청 시 connection을 재사용할 수 있다.
// (process.env.NODE_ENV !== "production" 가드를 제거)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
