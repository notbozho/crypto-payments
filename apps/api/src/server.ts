import httpServer from "./app";
import { config } from "./config";

const PORT = config.port || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
