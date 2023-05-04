const { clients } = require('../clients');
const config = require('../../config');

/**
 * Initiate new Call request to a target user
 *
 * Sends a request to the target user to initiate a call
 * If target user accepts call, target user's peer id is sent back to initiator
 * If target user rejects call, initiator is notified
 * 
 * @param {Object} data
 * @param {String} data.targetuser_email - Email of target user
 * @param {String} data.peer_id - Peer JS id of initiator
 */
const newCallRequest = async function (data, res) {
    try {
        const socket = this
        const { targetuser_email, peer_id } = data

        // Get targetuser client
        const targetuser_client = clients.get(targetuser_email)

        // If targetuser is not online, notify initiator
        if (targetuser_client == null) {
            res({ message: 'targetuser is offline' })
            return
        }

        // If targetuser is online, notify targetuser of incoming call
        targetuser_client.emit('call:incoming', { caller: socket.user, peer_id })

        let response = false;
        // Await targetuser response with targetuser's peer id
        const targetuser_response = await new Promise((resolve, reject) => {
            console.log('awaiting targetuser response')

            function handleCallRequestResponse(data) {
                response = true
                console.log('targetuser response received')
                targetuser_client.removeAllListeners('call:request:response', handleCallRequestResponse)

                if (data == null || data.peer_id == null) resolve(null);

                resolve(data)
            }

            targetuser_client.on('call:request:response', handleCallRequestResponse)

            // Set timeout to close call if no response
            setTimeout(() => {
                if (response) return;
                targetuser_client.emit('call:timeout', { message: 'Call timeout' })

                // Close socket listener
                targetuser_client.removeAllListeners('call:request:response')

                resolve(null)
            }, config.CALL_REQUEST_TIMEOUT * 1000)
        })

        if (targetuser_response == null || targetuser_response.peer_id == null) {
            res({ message: 'targetuser rejected call' })
            return
        }

        // If targetuser accepts call, notify initiator
        res(null, { peer_id: targetuser_response.peer_id })

        return
    } catch (error) {
        console.log(error)
        res(error)
        return
    }
}

module.exports = (io, socket) => {
    const res = (error, data) => {
        if (error) {
            socket.emit('call:error', { error });
        } else {
            socket.emit('call:success', { data });
        }
    };

    socket.on('call:request', (data) => newCallRequest.call(socket, data, res));
};

