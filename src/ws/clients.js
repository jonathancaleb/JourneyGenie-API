const clients = new Map();

const addClient = (socket) => {
    const user_identifier = socket.user.email || socket.user.id
    clients.set(user_identifier, socket);
};

const removeClient = (socket) => {
    const user_identifier = socket.user.email || socket.user.id
    clients.delete(user_identifier);
    console.log(clients.keys())
};

module.exports = {
    removeClient,
    addClient,
    clients,
};
