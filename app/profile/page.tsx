"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";
import InDev from "@/components/InDev";

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
        <InDev />
    )
}