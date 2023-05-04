class SocketRequestObject {
    constructor (socket) {
        this.path = null
        this.data = null
        this.socket = socket

        this.send = function (error, data) {
            const response_path = this.path
            const reponse_data = this.data
        
            if (error) console.log(error);

            socket.emit(response_path, reponse_data)
        }   
    }
}

class SK {
    constructor (socket) {
        this.socket = socket
        this.res = new Map()
    }   
}

const res = new Map()

res.send = (error, data) => {
    const response_path = res.path
    const response_data = { error, data }

    if (error) console.log(error);

    socket.emit(response_path, response_data)
}

function socketHandlerMiddleware(data, path) {
    const socket = this;
    socket.io = io
    const socketRequestHandler = socket_paths[path];
    const req = { user: socket.user, data, path }
    res.path = 'response:' + path;

    if (socket.user) return socketRequestHandler.call(socket, req, res);
    res.send(res.path, { error: 'User is not authenticated' })
}

module.exports = socketHandlerMiddleware
