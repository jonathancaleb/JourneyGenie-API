function joinRoom (client, room_id) {
    room_id = room_id.toString()

    const client_in_chatroom = room_id in client.rooms
    if (!client_in_chatroom) {
        client.join(room_id)
    }
}

module.exports = {
    joinRoom
}
