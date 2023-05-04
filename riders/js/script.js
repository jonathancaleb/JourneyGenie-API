const alert_window = document.querySelector('.alert');
const alert_close = document.querySelector('.btn-close');

window.onload = () => {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

function show_alert() {
    console.log('show alert')
    alert_window.classList.remove('hide')
    alert_window.classList.add('show');

    const yes_btn = document.querySelector('.yes');
    const no_btn = document.querySelector('.no');

    yes_btn.addEventListener('click', () => {
        socket.emit('ride:accepted', { accepted: true });
        close_alert();
    })
    no_btn.addEventListener('click', () => {
        socket.emit('ride:rejected', { accepted: false });
        close_alert();
    })
    alert_close.addEventListener('click', () => {
        close_alert();
    });
}

function close_alert() {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

const init_chat = document.querySelector('.initiate-chat');
const send_message = document.querySelector('.send-message');
const get_prev_messages = document.querySelector('.get-previous-messages')
const message_content = document.querySelector('.message-content');
const target_email = document.querySelector('.target-mail');

const api_url = 'http://localhost:5000/api/v1';
let chat_room_id = null;

// Chat room helpers
{
    function saveChatRoomIdToStorage(room_id) {
        localStorage.setItem(email + ':chat_room_id', room_id);
    }

    function getChatRoomIdFromStorage() {
        const stored_room_id = localStorage.getItem(email + ':chat_room_id');
        return stored_room_id
    }

    function getMessagesHandler(data) {
        console.log('Get messages handler')
        const { messages } = data
        console.log(messages)
    }

    function newChatRoomMessgeHandler(data) {
        console.log('new message')
        const { message } = data
        console.log(message.sender.email + ': ' + message.message)
    }
}

// Response handlers
function joinRoomResponseHandler(data) {
    console.log(data)
}
socket.on('response:chat:join', joinRoomResponseHandler)

function chatInviteHandler(data) {
    const { chat_room_id } = data
    console.log('New chat room invite: ', chat_room_id)
    saveChatRoomIdToStorage(chat_room_id)

    socket.emit('chat:join', { chat_room_id })
    
    if (!socket.hasListeners(chat_room_id + ':chat:message:new')) {
        socket.on(chat_room_id + ':chat:message:new', newChatRoomMessgeHandler);
    }
}
socket.on('chat:invite', chatInviteHandler)

function initiateChatResponseHandler(data) {
    if (data.error) {
        console.log('ERROR: ', data.error)
        return
    }

    chat_room_id = data.data?.chat_room_id;

    saveChatRoomIdToStorage(chat_room_id)

    if (!socket.hasListeners(chat_room_id + ':chat:message:new')) {
        socket.on(chat_room_id + ':chat:message:new', newChatRoomMessgeHandler);
    }
}
socket.on('response:chat:initiate', initiateChatResponseHandler);

function sendMessageResponseHandler(data) {
    console.log('message sent', data)
}
socket.on('reponse:chat:message:new', sendMessageResponseHandler);

function getPreviousMessagesResponseHandler(data) {
    console.log('previous messages')
    console.log(data)
}
socket.on('response:chat:message:previous', getPreviousMessagesResponseHandler);

// Send message to chat room
send_message.addEventListener('click', () => {
    socket.emit('chat:message:new', {
        message: message_content.value,
        chat_room_id: getChatRoomIdFromStorage()
    });
});

// Intitate Chat
init_chat.addEventListener('click', async function () {
    console.log('init chat')
    const response = await axios.get(api_url + '/user/user-data', {
        params: {
            target_email: target_email.value,
           
        }
    })

    const { data } = response;
    const user_data = data.data.user;

    console.log(user_data)
    socket.emit('chat:initiate', {
        targetuser_id: user_data._id,
        ride_id: '63f2864de258e2b0a9d00297'
    });
});

// Get previous messages
get_prev_messages.addEventListener('click', () => {
    console.log('gettign prev messages')
    socket.emit('chat:message:previous', {
        chat_room_id: getChatRoomIdFromStorage()
    });
})
