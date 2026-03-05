import {version} from "./package.json"
const nextConfig = {
    output: "standalone",
    env: {
        APP_VERSION: version,
    },
    images: {
        qualities: [25, 50, 75, 100],
    },
};

export default nextConfig;
