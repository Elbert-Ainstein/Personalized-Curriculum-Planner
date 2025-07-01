"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/course-selection");
  }, [router]);
  return null;
}