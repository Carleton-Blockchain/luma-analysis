/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/",
          destination: "https://dashboard.carletonblockchain.ca",
          permanent: true,
        },
      ];
    }
    return [];
  },
  // Add other config options as needed
};

module.exports = nextConfig;
