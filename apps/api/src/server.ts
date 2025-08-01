import app from "./app";
import { config } from "./config";

const PORT = config.port || 3001;

app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
