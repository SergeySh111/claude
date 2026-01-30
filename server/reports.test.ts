import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("reports router", () => {
  it("creates a report and retrieves it", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.reports.create({
      name: "Test Report",
      summaryFileName: "summary.csv",
      dailyFileName: "daily.csv",
      summaryData: JSON.stringify([{ campaign: "Test", spend: 100 }]),
      dailyData: JSON.stringify([{ date: "2025-01-01", revenue: 200 }]),
      dateRange: "2025-01-01 to 2025-01-31",
    });

    expect(createResult).toHaveProperty("id");
    expect(typeof createResult.id).toBe("number");

    const getResult = await caller.reports.get({ id: createResult.id });

    expect(getResult).toBeDefined();
    expect(getResult?.name).toBe("Test Report");
    expect(getResult?.summaryFileName).toBe("summary.csv");
    expect(getResult?.dailyFileName).toBe("daily.csv");
    expect(getResult?.dateRange).toBe("2025-01-01 to 2025-01-31");
  });

  it("lists user reports", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list();

    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBeGreaterThanOrEqual(0);
  });

  it("prevents unauthorized access to other user's reports", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    const createResult = await caller1.reports.create({
      name: "User 1 Report",
      summaryFileName: "summary.csv",
      dailyFileName: "daily.csv",
      summaryData: JSON.stringify([]),
      dailyData: JSON.stringify([]),
    });

    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.reports.get({ id: createResult.id })
    ).rejects.toThrow();
  });

  it("deletes a report", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.reports.create({
      name: "Report to Delete",
      summaryFileName: "summary.csv",
      dailyFileName: "daily.csv",
      summaryData: JSON.stringify([]),
      dailyData: JSON.stringify([]),
    });

    const deleteResult = await caller.reports.delete({ id: createResult.id });

    expect(deleteResult).toEqual({ success: true });

    const getResult = await caller.reports.get({ id: createResult.id });
    expect(getResult).toBeUndefined();
  });
});
