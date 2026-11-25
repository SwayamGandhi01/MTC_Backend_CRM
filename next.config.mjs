/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@node-rs/argon2", "mongoose", "ably", "resend"],
};

export default nextConfig;
