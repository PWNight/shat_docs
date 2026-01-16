"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";

export default function Profile() {
    const router = useRouter()

    useEffect(()=>{
        getSession().then(data => {
            if ( !data ) {
                router.push("/login?to=profile/");
            }
        })
    },[router])

    return (
        <div>
            <h1>Добро пожаловать</h1>
        </div>
    )
}