import { db, users } from "@minimall/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      instagramUsername, 
      phoneNumber, 
      password, 
      shopDomain 
    } = body;

    // Check if Instagram username already exists
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }
    
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Check if it's the Instagram username that matches
      const userData = existingUser[0];
      if (userData && userData.permissions && 
          Array.isArray(userData.permissions) && 
          (userData.permissions as any[]).some((p: any) => p.instagram === instagramUsername)) {
        return NextResponse.json(
          { 
            error: "instagram_exists",
            message: `An account for the instagram username @${instagramUsername} already exists` 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "email_exists", message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + process.env.SHOPIFY_API_SECRET)
      .digest("hex");

    // Create new user
    const newUser = await db!
      .insert(users)
      .values({
        email,
        name: `${firstName} ${lastName}`,
        shopDomain: shopDomain || "",
        role: "admin",
        permissions: [
          { 
            instagram: instagramUsername,
            phone: phoneNumber,
            passwordHash 
          }
        ]
      })
      .returning();

    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Store session (you might want to use Redis or a session table)
    const createdUser = newUser[0];
    if (!createdUser) {
      return NextResponse.json(
        { error: "signup_failed", message: "Failed to create account" },
        { status: 500 }
      );
    }
    
    const response = NextResponse.json(
      { 
        success: true, 
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name
        }
      },
      { status: 201 }
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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "signup_failed", message: "Failed to create account" },
      { status: 500 }
    );
  }
}