const { randomUUID } = require("crypto")
const { ChatRoom, Message } = require("../../models/chat.model")
const { Ride } = require("../../models/ride.model")
const { clients } = require("../clients")
const { User } = require("../../models/users.model")
const { joinRoom } = require('../utils/rooms')

async function sendChatRoomInviteToClient(target_user_id, room_id) {
    const target_user_data = await User.findById(target_user_id);

    const target_client = clients.get(target_user_data.email)
    const client_in_chatroom = room_id in target_client.rooms

    // Send invite to target client if not already in room
    if (!client_in_chatroom) {
        target_client.emit("chat:invite", { chat_room_id: room_id });
    }

    return;
}

const initiateChat = async function (req, res) {
    const { data } = req
    const socket = this;
    const { targetuser_id, ride_id } = data;

    // Check for missing requred fields
    if (!targetuser_id) {
        res.send("Missing required field: targetuser_id");
        return;
    }

    // Check if ride exists
    const ride = await Ride.findById(ride_id).populate('rider');
    if (!ride) {
        res.send("Ride does not exist");
        return;
    }

    // Check if user is part of ride
    if (ride.rider.user.toString() != socket.user._id &&
        ride.passenger.toString() != socket.user._id) {
        res.send("User is not part of ride");
        return;
    }

    // Check if an existing chat room exist
    const populate_config = {
        path: 'messages',
        populate: {
            path: 'sender',
            select: 'email firstname lastname'
        }
    }
    const chat_room_doc = await ChatRoom.findOne({
        ride: ride_id,
        users: { $all: [socket.user._id, data.targetuser_id] },
    }).populate(populate_config)

    let chat_room = chat_room_doc?.toJSON()

    // If chat room exists, notify initiator of chat room id
    // and invite target user to chat room
    if (chat_room) {
        // Add initiator to chat room
        joinRoom(socket, chat_room._id)

        // Send invite to target user (i.e invitee)
        sendChatRoomInviteToClient(targetuser_id, chat_room._id)

        res.send(null, { chat_room_id: chat_room._id });
        return;
    }

    // If chat room does not exist, create new chat room
    const new_chat_room = await ChatRoom.create({
        users: [socket.user._id, data.targetuser_id],
        ride: ride_id,
        messages: [],
    });

    joinRoom(socket, new_chat_room._id)

    // Invite target user to chat room
    sendChatRoomInviteToClient(targetuser_id, new_chat_room._id)

    // Notify initiator of chat room id
    res.send(null, { chat_room_id: new_chat_room._id });

    return;
}

const sendMessageToChatRoom = async function (req, res) {
    const socket = this
    const { chat_room_id, message } = req.data

    // Check if chat room exists
    const chat_room = await ChatRoom.findById(chat_room_id).populate('messages')
    if (!chat_room) {
        res.send('Chat room does not exist')
        return
    }

    // Check if user is part of chat room
    const user_in_chat_room = chat_room.users.includes(socket.user._id)
    if (!user_in_chat_room) {
        res.send('User is not part of chat room')
        return
    }

    // Create new message
    let new_message = await Message.create({
        sender: socket.user._id,
        chat_room: chat_room_id,
        message,
    })

    // Add senders data to message
    const populate_config = {
        path: 'sender',
        select: 'firstname lastname email'
    }
    new_message = await new_message.populate(populate_config)

    // Notify all users in chat room of new message
    let path = chat_room_id + ':chat:message:new'
    io.to(chat_room_id).emit(path, { message: new_message })

    res.send(null, { message: new_message })
    return
}

const joinChatRoom = async function (req, res) {
    const socket = this
    const { chat_room_id } = req.data

    const chat_room = await
        ChatRoom
            .findById(chat_room_id)
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'email firstname lastname'
                }
            })
    
    // Check if chat room exists
    if (!chat_room) {
        res.send({ error: 'Chat room not found' }); return;
    }

    // Check if user is part of chat room
    if (!chat_room.users.includes(socket.user._id)) {
        res.send({ error: 'User is not a member of this chatroom' }); return;
    }

    // Add user to chat room
    joinRoom(socket, chat_room_id)

    res.send(null, { chat_room })
    return
}

const getPreviousChatRoomMessages = async function (req, res) {
    const socket = this
    const { chat_room_id } = req.data

    const chat_room = await
        ChatRoom
            .findById(chat_room_id)
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'email firstname lastname'
                }
            })
    
    // Check if chat room exists
    if (!chat_room) {
        res.send({ error: 'Chat room not found' })
        return;
    }

    // Check if user is part of chat room
    if (!chat_room.users.includes(socket.user._id)) {
        res.send({ error: 'User is not a member of this chatroom' })
        return;
    }

    res.send(null, { messages: chat_room })
    return
}

module.exports = (io, socket) => {
    try {
        global.io = io;

        const res = new Map()
        res.send = (error, data) => {
            const response_path = res.path
            const response_data = { error, data }

            if (error) console.log(error);
            socket.emit(response_path, response_data)
        }

        async function socketHandlerMiddleware(data, path) {
            try {
                const socket = this;

                // Get request handler from socket_paths
                const socketRequestHandler = socket_paths[path];

                const req = { user: socket.user, data, path }
                res.path = 'response:' + path;

                // Check if user is authenticated 
                // if authenticated socket.user will be set by auth middleware
                let response = null;
                if (socket.user) {
                    response = await socketRequestHandler.call(socket, req, res);
                    return;
                }
                if (response instanceof Error) { throw response };

                res.send(res.path, { error: 'User is not authenticated' })
            } catch (error) {
                console.log(error)
                res.send(res.path, { error: 'Something went wrong' })
            }
        }

        const socket_paths = {
            "chat:initiate": initiateChat,
            "chat:message:new": sendMessageToChatRoom,
            "chat:message:previous": getPreviousChatRoomMessages,
            "chat:join": joinChatRoom,
        };

        socket.on("chat:initiate",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:initiate"));
        socket.on("chat:message:new",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:message:new"));
        socket.on("chat:message:previous",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:message:previous"));
        socket.on("chat:join",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:join"))

    } catch (error) {
        console.log(error)
    }
}
