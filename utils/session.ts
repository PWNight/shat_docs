"use server"
import { SignJWT, jwtVerify } from 'jose' 
import { cookies } from 'next/headers'
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)


export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}
 
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}
export async function createSession(token: any, expiresAt: any) {
    const cookiesStore = await cookies()
    return cookiesStore.set('s_token', token, {
        httpOnly: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function deleteSession() {
    const cookiesStore = await cookies()
    cookiesStore.delete('s_token')
}