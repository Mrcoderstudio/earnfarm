import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status"); // 1 = completed, 2 = cancelled
    const amountLocal = searchParams.get("amount_local"); // Amount in USD usually
    const transId = searchParams.get("trans_id");
    const receivedHash = searchParams.get("hash");

    if (!userId || !status || !transId || !receivedHash) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify the hash to ensure it's really from CPX
    const secret = process.env.CPX_SECURE_HASH;
    const expectedHash = crypto.createHash("md5").update(`${transId}-${secret}`).digest("hex");

    if (receivedHash !== expectedHash) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 403 });
    }

    // Agar user ne survey complete kiya hai (status = 1)
    if (status === "1") {
      const amountUSD = parseFloat(amountLocal || "0");
      // 10,000 coins = $1. Yani 1 cent = 100 coins.
      const coinsToAdd = Math.floor(amountUSD * 10000);

      if (coinsToAdd > 0) {
        await db.update(users)
          .set({
            coins: sql`${users.coins} + ${coinsToAdd}`,
            totalEarned: sql`${users.totalEarned} + ${coinsToAdd}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return NextResponse.json({ success: true, added: coinsToAdd });
      }
    }

    return NextResponse.json({ success: true, message: "No coins added" });
  } catch (error) {
    console.error("CPX Postback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}