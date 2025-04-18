import jwt from "jsonwebtoken";
import { APIGatewayProxyEvent } from "aws-lambda";
import crypto from "crypto";
import { Users } from "../entities/Users";

export const authenticateToken = (event: APIGatewayProxyEvent) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    console.error("Authorization header missing.");
    return null;
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined.");
    return null;
  }

  try {
    // Verify the token to ensure it's valid
    const verifiedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      userId: string;
    };

    return verifiedToken.userId; // Return the userId from the verified token
  } catch (err: any) {
    console.error("Token verification failed:", err.message);
    return null;
  }
};
export const generateAccessToken = (user: Users): string => {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: "1440m" } // Access token expires in 24 hours
  );
};
export const newGenerateAccessToken = (user: Users): string => {
  return jwt.sign(
    { userId: user.id, username: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "1440m" } // Access token expires in 24 hours
  );
};

export const generateRefreshToken = (user: Users): string => {
  return crypto.randomBytes(64).toString("hex"); // Generate a random refresh token
};
export const newGenerateRefreshToken = (user: Users): string => {
  return crypto.randomBytes(64).toString("hex"); // Generate a random refresh token
};
