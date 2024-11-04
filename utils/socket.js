import { Server } from 'socket.io';

export const configureSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
        }
    });

    io.userSockets = new Map();

    io.on('connection', (socket) => {
        console.log('Un utilisateur connecté');
        socket.on('registerUser', (userId) => {
            io.userSockets.set(userId, socket.id);
            console.log(`Utilisateur ${userId} enregistré`);
        });

        socket.on('disconnect', () => {
            for (const [userId, socketId] of io.userSockets.entries()) {
                if (socketId === socket.id) {
                    io.userSockets.delete(userId);
                    break;
                }
            }
        });
    });

    return io;
};
