"use client"
import { Suspense } from "react";
import Browser from "./components/Browser/Browser";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Browser />
    </Suspense>
  );
}
