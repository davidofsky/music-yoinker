import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'resources.tidal.com',
			},
			{
				protocol: 'https',
				hostname: 'static.qobuz.com',
			},
		],
	},
};

export default nextConfig;
