import { db, users } from "@minimall/db";
import { eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password, shopDomain } = body;

    // Find user by email or Instagram username
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }
    
    const foundUsers = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, usernameOrEmail),
          eq(users.email, usernameOrEmail.replace("@", "")) // Handle @username format
        )
      )
      .limit(1);

    if (foundUsers.length === 0) {
      // Try to find by Instagram username in permissions
      const allUsers = await db!.select().from(users);
      const userByInstagram = allUsers.find(user => {
        if (user.permissions && Array.isArray(user.permissions)) {
          return (user.permissions as any[]).some(
            (p: any) => p.instagram === usernameOrEmail.replace("@", "")
          );
        }
        return false;
      });

      if (!userByInstagram) {
        return NextResponse.json(
          { error: "invalid_credentials", message: "Invalid username/email or password" },
          { status: 401 }
        );
      }

      foundUsers.push(userByInstagram);
    }

    const user = foundUsers[0];
    
    if (!user) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + process.env.SHOPIFY_API_SECRET)
      .digest("hex");

    const userPermissions = user.permissions as any[];
    const validPassword = userPermissions?.some((p: any) => p.passwordHash === passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    // Verify shop domain matches (if provided)
    if (shopDomain && user.shopDomain !== shopDomain) {
      return NextResponse.json(
        { error: "shop_mismatch", message: "User not associated with this shop" },
        { status: 403 }
      );
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Create response with session
    const response = NextResponse.json(
      { 
        success: true, 
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          shopDomain: user.shopDomain
        }
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set("minimall_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "signin_failed", message: "Failed to sign in" },
      { status: 500 }
    );
  }
}