import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'resources.tidal.com',
			},
		],
	},
};

export default nextConfig;
