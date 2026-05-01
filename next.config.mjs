/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  webpack(config, { isServer }) {
    // Required for @imgly/background-removal WASM assets
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    if (!isServer) {
      // Exclude the Node.js ONNX runtime from the browser bundle —
      // only the WASM/web variant is needed in the browser
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
      };
    }

    // Allow webpack to handle .mjs files inside node_modules correctly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });

    return config;
  },
};

export default nextConfig;
