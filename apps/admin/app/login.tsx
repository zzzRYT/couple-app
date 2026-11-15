'use client';
import { signIn, signOut } from 'next-auth/react';
export function SignIn() { return <button onClick={()=>signIn('google', {callbackUrl:'/'})}>Google로 로그인</button>; }
export function SignOut() { return <button className="secondary" onClick={()=>signOut({callbackUrl:'/'})}>로그아웃</button>; }
