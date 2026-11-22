"use client"
import Link from "next/link";
import { Typography } from "antd";

// Links back to the empty homepage.
const Logo = () => (
  <Link href="/" aria-label="Yoinker home" style={{ color: 'inherit' }}>
    <Typography.Title style={{ margin: 0, fontFamily: 'var(--font-bbh-bogle)' }}>
      YOINKER
    </Typography.Title>
  </Link>
);

export default Logo;
