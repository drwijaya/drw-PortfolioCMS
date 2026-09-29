import { jwtVerify, type JWTVerifyGetKey } from "jose";

export function accessToken(headers: Headers, allowCookie = false) {
  const assertion = headers.get("cf-access-jwt-assertion");
  if (assertion !== null) return assertion;
  if (!allowCookie) return undefined;
  return headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("CF_Authorization="))
    ?.slice("CF_Authorization=".length);
}

export async function verifyAccessToken(
  token: string,
  keys: JWTVerifyGetKey,
  config: { issuer: string; audience: string; owner: string },
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "email"],
  });
  if (
    typeof payload.email !== "string" ||
    payload.email.toLowerCase() !== config.owner.toLowerCase()
  )
    throw new Error("Wrong identity");
}
