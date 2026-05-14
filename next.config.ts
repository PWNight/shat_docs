import {version} from "./package.json"
const nextConfig = {
    serverExternalPackages: ["better-sqlite3"],
    env: {
        APP_VERSION: version,
    },
    images: {
        qualities: [25, 50, 75, 100],
    },
};

export default nextConfig;
