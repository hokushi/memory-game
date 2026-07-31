import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // S3 の署名付き URL（bucket.s3.<region>.amazonaws.com）を next/image で許可する
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.ap-northeast-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
