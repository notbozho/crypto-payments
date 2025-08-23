// components/WebSocketProvider.tsx

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    socket: null,
    isConnected: false,
});

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

interface WebSocketProviderProps {
    children: ReactNode;
    url?: string;
    autoConnect?: boolean;
}

export function WebSocketProvider({
    children,
    url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
    autoConnect = false,
}: WebSocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!autoConnect) return;

        const socketInstance = io(url, {
            transports: ["websocket"],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("WebSocket disconnected:", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error);
            setIsConnected(false);
            toast.error("Connection error", {
                description: "Unable to establish real-time connection",
            });
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [url, autoConnect]);

    return (
        <WebSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
}
