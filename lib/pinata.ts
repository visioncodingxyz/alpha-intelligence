import { PinataSDK } from "pinata"

if (!process.env.PINATA_JWT) {
  throw new Error("PINATA_JWT environment variable is required")
}

if (!process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL) {
  throw new Error("NEXT_PUBLIC_PINATA_GATEWAY_URL environment variable is required")
}

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL,
})
