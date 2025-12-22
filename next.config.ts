import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure compatibility with older browsers including Safari
  transpilePackages: ['recharts', 'xlsx'],
  
  experimental: {
    // Optimize for better browser compatibility
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
};

export default nextConfig;
