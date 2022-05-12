
const { SOCKET_EVENTS, LESSON_STATUS, SOCKET_EVENTS_TYPES, SOCKET_OPERATIONS, USER_TYPES } = require('../../utils/constants');
let _ = require(`lodash`);
let { roomService, authService, userService } = require(`../../services`);
let lCounter = 0, rCounter = 0;

let socketConnection = {};
socketConnection.connect = function (io, p2p) {
    io.use(authService.socketAuthentication);
    io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
        // console.log('connection established', socket.id);
        // //get ongoing room of the user.
        // let ongoingRoomId = socket.handshake.query.roomId;
        // console.log('ongoingRoomId', ongoingRoomId);
        // let onGoingRoom = await roomService.getRoom({ _id: ongoingRoomId }, {}, { lean: true });
        // if (onGoingRoom) {
        //     console.log("On going room Id", onGoingRoom._id)
        //     let updatedRoom = await roomService.updateRoom({ _id: onGoingRoom._id, 'users.userId': socket.id }, { 'users.$.isOnline': true }, { new: true, lean: true });
        //     onGoingRoom = (await roomService.getRoomWithUsersInfo({ _id: updatedRoom._id }))[0];
        //     socket.join(onGoingRoom._id.toString());
        //     console.log("RoomData", onGoingRoom.roomData);
        //     let data = {};
        //     data.eventType = SOCKET_EVENTS_TYPES.SYNC_DATA;
        //     data.data = { roomId: onGoingRoom._id, roomData: onGoingRoom.roomData || {} };
        //     if (onGoingRoom.createdBy.toString() == socket.id) {
        //         io.in(onGoingRoom._id.toString()).emit('SingleEvent', data);
        //     } else {
        //         socket.to(onGoingRoom._id.toString()).emit('SingleEvent', data);
        //     }
        //     socket.emit(SOCKET_EVENTS.RECONNECTED_SERVER, { data: { reconnect: true, roomId: onGoingRoom._id } });
        //     let onlineUsers = onlineUsersFromAllUsers(onGoingRoom.users);
        //     io.in(onGoingRoom._id).emit('SingleEvent', { data: { users: onlineUsers }, eventType: SOCKET_EVENTS.STUDENT_STATUS, roomId: onGoingRoom._id });
        // }
        socket.use((packet, next) => {
            // console.log("Socket hit:=>", packet);
            next();
        });

        /**
         * socket disconnect event.
         */
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            console.log('Disconnected socket id is ', socket.id);
            let room = await roomService.getRoom({ 'users.userId': socket.id, lessonStatus: LESSON_STATUS.ON_GOING }, {}, { lean: true, sort: { createdAt: -1 } });
            if (room) {
                socket.leave(room._id.toString());
                let dataToUpdate = {};
                if (room.currentTurnUserId && room.currentTurnUserId.toString() == socket.id) {
                    //remove the currentTurn so that new turn can be choose from friend end 
                    dataToUpdate = { $unset: { currentTurnUserId: 1 } };
                    io.in(room._id.toString()).emit('SingleEvent', { data: { users: [] }, eventType: SOCKET_EVENTS_TYPES.STUDENT_TURN });
                }
                // set the user status to offline
                let updatedRoom = await roomService.updateRoom({ _id: room._id, 'users.userId': socket.id }, { 'users.$.isOnline': false, ...dataToUpdate }, { lean: true, new: true });
                // aggregate user info with the users name 
                let latestRoomInfo = (await roomService.getRoomWithUsersInfo({ _id: room._id }))[0];
                //filter online users adn remove off line users
                let onlineUsers = onlineUsersFromAllUsers(latestRoomInfo.users);
                // send data of the online users to all the room members
                io.in(latestRoomInfo._id.toString()).emit('SingleEvent', { data: { users: onlineUsers, roomId: room._id, teacherId: updatedRoom.createdBy }, eventType: SOCKET_EVENTS_TYPES.STUDENT_STATUS });
            }
        });



        /**
         * Single socket event to manage all the socket events.
         * 
         */

        socket.on('SingleEvent', async (data) => {
            if (data.eventType) {
                // check if valid event type. 
                if (Object.values(SOCKET_EVENTS_TYPES).indexOf(data.eventType) === -1) {
                    data.eventType = SOCKET_EVENTS_TYPES.SOCKET_ERROR;
                    data.data = { msg: 'Invalid event type.' };
                    socket.emit('SingleEvent', data);
                }
                if (data.eventType === SOCKET_EVENTS_TYPES.CREATE_ROOM) {
                    await createRoom(socket, data);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.JOIN_ROOM) {
                    await joinRoom(socket, data, io);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.UPDATE_ROOM_DATA) {
                    let roomId = ((data || {}).data || {}).roomId, roomData = ((data || {}).data || {}).roomData;
                    await roomService.updateRoom({ _id: roomId }, { roomData });
                } else if (data.eventType === SOCKET_EVENTS_TYPES.EXIT_ROOM) {
                    await exitRoom(socket, data, io);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.SWITCH_TURN_BY_TEACHER) {
                    await switchTurnByTeacher(socket, data, io);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.SWITCH_TURN_BY_STUDENT) {
                    await switchTurnByStudent(socket, data, io);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.COMPLETE_LESSON) {
                    await completeLession(socket, data, io);
                } else if (data.eventType === SOCKET_EVENTS_TYPES.STUDENT_STATUS) {
                    let roomId = ((data || {}).data || {}).roomId;
                    let latestRoomInfo = (await roomService.getRoomWithUsersInfo({ _id: roomId }))[0];
                    if (latestRoomInfo) {
                        let onlineUsers = onlineUsersFromAllUsers(latestRoomInfo.users);
                        io.in(roomId).emit('SingleEvent', { data: { users: onlineUsers, roomId, teacherId: latestRoomInfo.createdBy }, eventType: SOCKET_EVENTS_TYPES.STUDENT_STATUS });
                    }
                } else if (data.eventType === SOCKET_EVENTS_TYPES.MODIFY_ROOM_DATA) {
                    let roomId = ((data || {}).data || {}).roomId;
                    let operation = ((data || {}).data || {}).operation;
                    let slideIndex = ((data || {}).data || {}).slideIndex || 0;
                    // let arrayOfTags = ((data || {}).data || {}).arrayOfTags || [];
                    let arrayToPush = ((data || {}).data || {}).arrayToPush;
                    // let userName = ((data || {}).data || {}).userName;
                    let criteria = { _id: roomId };
                    let dataToUpdate = {}, condition = {};
                    if (operation === SOCKET_OPERATIONS.CLEAR && arrayToPush && arrayToPush.length) {
                        for (let index = 0; index < arrayToPush.length; index++) {
                            condition[`roomData.data.dataArray.${arrayToPush[index].userName}.${arrayToPush[index].slideIndex}`] = [];
                        }
                        // condition[`roomData.data.dataArray.${userName}.${slideIndex}`] = [];
                        dataToUpdate = { $set: condition };
                    }
                    else if (operation === SOCKET_OPERATIONS.INSERT) {
                        for (let index = 0; index < arrayToPush.length; index++) {
                            condition[`roomData.data.dataArray.${arrayToPush[index].userName}.${arrayToPush[index].slideIndex}`] = { $each: arrayToPush[index].data };
                        }
                        // condition[`roomData.data.dataArray.${userName}.${slideIndex}`] = { $each: arrayToPush };
                        dataToUpdate = { $push: condition };

                    } else if (operation === SOCKET_OPERATIONS.REMOVE) {
                        for (let index = 0; index < arrayToPush.length; index++) {
                            condition[`roomData.data.dataArray.${arrayToPush[index].userName}.${arrayToPush[index].slideIndex}`] = { tag: { $in: arrayToPush[index].data } };
                        }
                        // condition[`roomData.data.dataArray.${userName}.${slideIndex}`] = { tag: { $in: arrayOfTags } };
                        dataToUpdate = { $pull: condition };

                    } else if (operation === SOCKET_OPERATIONS.CHANGE_INDEX) {
                        condition[`roomData.data.slideIndex`] = slideIndex;
                        dataToUpdate = condition;
                    }
                    let updatedRoom = await roomService.updateRoom(criteria, dataToUpdate, { new: true });
                    return;
                } else if (data.eventType === SOCKET_EVENTS_TYPES.SAVE_GAME_DATA) {
                    let roomId = ((data || {}).data || {}).roomId;
                    await roomService.updateRoom({ _id: roomId }, { $set: { startAt: Date.now() } });
                }
                else {
                    if (data.roomId) {
                        socket.to(data.roomId).emit('SingleEvent', data);
                    }
                }
            } else {
                // console.log('Event here ');
                data.eventType = SOCKET_EVENTS_TYPES.SOCKET_ERROR;
                data.data = { msg: 'Invalid payload.' };
                socket.emit('SingleEvent', data);
            }
        });

    });
};

let onlineUsersFromAllUsers = (allUsers) => {
    let onlineUsers = _.filter(allUsers, {
        isOnline: true
    })
    // console.log('Online users are ', onlineUsers);
    return onlineUsers;
};

let leaveAllPreviousRooms = async (socket, io) => {
    let ongoingRooms = io.sockets.adapter.sids[socket.id];
    for (let room in ongoingRooms) {
        let roomInfo = await roomService.getRoom({ _id: room.toString() }, {}, { lean: true });
        socket.leave(room.toString());
        if (roomInfo) {
            let dataToUpdate = {};
            if (roomInfo.currentTurnUserId && roomInfo.currentTurnUserId == socket.id) {
                dataToUpdate = { $unset: { currentTurnUserId: 1 } };
                io.in(roomInfo._id.toString()).emit('SingleEvent', { data: { users: [] }, eventType: SOCKET_EVENTS_TYPES.STUDENT_TURN });
            }
            let updatedRoom = await roomService.updateRoom({ _id: roomInfo._id, 'users.userId': socket.id }, { 'users.$.isOnline': false, ...dataToUpdate }, { lean: true, new: true });
            let latestRoomInfo = (await roomService.getRoomWithUsersInfo({ _id: roomInfo._id }))[0];
            let onlineUsers = onlineUsersFromAllUsers(latestRoomInfo.users);
            io.in(latestRoomInfo._id.toString()).emit('SingleEvent', { data: { users: onlineUsers, roomId: roomInfo._id, teacherId: latestRoomInfo.createdBy }, eventType: SOCKET_EVENTS_TYPES.STUDENT_STATUS });
        }
    }
    await roomService.updateMany({ 'users.userId': socket.id }, { 'users.$.isOnline': false }, { lean: true, new: true });

};
// teacher fire this event 
let createRoom = async (socket, data) => {
    // leave all the room as user can be part of single room at one time 
    await leaveAllPreviousRooms(socket, io);
    let roomNumber = await roomService.getRoom({}, {}, { sort: { createdAt: -1 } });
    //create room.
    let dataToSave = {
        createdBy: socket.id,
        users: [{ userId: socket.id }],
        capacity: ((data || {}).data || {}).capacity, //room strength currently static from front end  
        _id: '1'
    };
    if (roomNumber) {
        dataToSave['_id'] = parseInt(roomNumber._id) + 1; //logic to increment room _id
        dataToSave._id.toString();
    }
    let roomInfo = await roomService.createRoom(dataToSave);
    // console.log('roomInfo', roomInfo._id.toString());
    socket.join(roomInfo._id.toString());
    data.data.roomId = roomInfo._id;
    socket.emit('SingleEvent', data);
};

// we get userType  here
let joinRoom = async (socket, data, io) => {
    //reconnecting old user or new user 
    await leaveAllPreviousRooms(socket, io);
    // along with the user rewards
    let userInfo = await userService.getUser({ _id: socket.id }, {}, { lean: true });
    let roomId = ((data || {}).data || {}).roomId;
    let roomInfo = await roomService.getRoom({ _id: roomId, lessonStatus: LESSON_STATUS.ON_GOING }, {}, { lean: true });
    if (!roomInfo) {
        data.eventType = SOCKET_EVENTS_TYPES.SOCKET_ERROR;
        data.data = { msg: 'Invalid room id.' };
        socket.emit('SingleEvent', data);
        return;
    }
    // if (roomInfo.users.length === (roomInfo.capacity + 1)) {
    //     data.eventType = SOCKET_EVENTS_TYPES.SOCKET_ERROR;
    //     data.data = { msg: 'Room is full.' };
    //     socket.emit('SingleEvent', data);
    //     return;
    // }
    //update the room.
    //check is user already in room then change the status of the user.
    let dataToUpdateWhenTeacherLogin = {};
    let starColor = -1;
    if (data.data && data.data.userType === USER_TYPES.TEACHER) {
        dataToUpdateWhenTeacherLogin[`createdBy`] = socket.id; //it is just teacher id
    } else {
        starColor = roomInfo.users.length - 1;
    }
    //set online if user already member else push into the users of the room
    let updatedRoom = await roomService.updateRoom({ _id: roomId, 'users.userId': socket.id }, { 'users.$.isOnline': true, ...dataToUpdateWhenTeacherLogin }, { lean: true, new: true });
    if (!updatedRoom) {
        if (roomInfo.users.length === (roomInfo.capacity + 1)) {
            data.eventType = SOCKET_EVENTS_TYPES.SOCKET_ERROR;
            data.data = { msg: 'Room is full.' };
            socket.emit('SingleEvent', data);
            return;
        }
        updatedRoom = await roomService.updateRoom({ _id: roomId, 'users.userId': { $ne: socket.id } }, { $push: { users: { userId: socket.id, starColor } }, ...dataToUpdateWhenTeacherLogin }, { lean: true, new: true });
    }
    let roomInfoWithUserInfo = await roomService.getRoomWithUsersInfo({ _id: roomId });
    roomInfoWithUserInfo = roomInfoWithUserInfo[0] || {};
    let allUsers = [...roomInfoWithUserInfo.users];
    let onlineUsers = onlineUsersFromAllUsers(allUsers);
    socket.join(roomId);
    data.data = { numberOfUsers: onlineUsers.length, roomData: roomInfoWithUserInfo.roomData || {}, roomId, rewards: (userInfo || {}).rewards || 0, startAt: roomInfoWithUserInfo.startAt || -1 };
    // number of online users,roomdata, roomId ,startAt : lesson start time , his rewards
    socket.emit('SingleEvent', data);

    data.data = { users: onlineUsers, roomId, teacherId: roomInfoWithUserInfo.createdBy };
    data.eventType = SOCKET_EVENTS_TYPES.STUDENT_STATUS; // call whenver any user join/leave the room as online users number is changed
    io.in(roomId).emit('SingleEvent', data);
};

/**
 * function when a student exit from room. 
 * @param {*} socket 
 * @param {*} data 
 * @param {*} io 
 */
let exitRoom = async (socket, data, io) => {
    let roomId = ((data || {}).data || {}).roomId;
    let updatedRoom = await roomService.updateRoom({ _id: roomId }, { $pull: { users: { userId: socket.id } } }, { lean: true, new: true });
    socket.leave(roomId);
    _.remove(updatedRoom.users, { userId: updatedRoom.createdBy });
    data.eventType = SOCKET_EVENTS_TYPES.STUDENT_STATUS;
    data.data = { users: updatedRoom.users, roomId, teacherId: updatedRoom.createdBy };
    io.in(roomId).emit('SingleEvent', data);
};

let switchTurnByTeacher = async (socket, data, io) => {
    //get userInfo
    let roomId = ((data || {}).data || {}).roomId,
        users = ((data || {}).data || {}).users;
    let userInfo = await userService.getUser({ userName: (users[0] || {}).userName || '' }, {});
    //update user turn in database.
    await roomService.updateRoom({ _id: roomId }, { $set: { currentTurnUserId: (userInfo || {})._id } });
    data.eventType = SOCKET_EVENTS_TYPES.STUDENT_TURN;
    io.in(roomId).emit('SingleEvent', data);
};


let switchTurnByStudent = async (socket, data, io) => {
    let roomId = ((data || {}).data || {}).roomId;
    let roomInfoWithUserInfo = await roomService.getRoomWithUsersInfo({ _id: roomId });
    let roomInfo = roomInfoWithUserInfo[0] || {};
    _.remove(roomInfo.users, { userId: roomInfo.createdBy });

    let allUsers = [...roomInfo.users];
    let onlineUsers = onlineUsersFromAllUsers(allUsers);
    // console.log(onlineUsers, "onlineUsers");
    let studentPos = _.findIndex(onlineUsers, { userId: socket.id });
    let nextPlayerIndex = ((studentPos + 1) % onlineUsers.length);
    // console.log(nextPlayerIndex, "nextPlayerIndex");

    // update the turn in the database
    await roomService.updateRoom({ _id: roomId }, { $set: { currentTurnUserId: onlineUsers[nextPlayerIndex].userId } });

    data.eventType = SOCKET_EVENTS_TYPES.STUDENT_TURN;
    data.data = { roomId, users: [{ userName: onlineUsers[nextPlayerIndex].userName }] };
    io.in(data.roomId).emit('SingleEvent', data);
};


let completeLession = async (socket, data, io) => {
    let roomId = ((data || {}).data || {}).roomId;
    let updatedRoom = await roomService.updateRoom({ createdBy: socket.id, _id: roomId }, { lessonStatus: LESSON_STATUS.COMPLETE }, { new: true, lean: true });    //TODO:add in constans
    if (updatedRoom) {
        io.in(roomId).emit('SingleEvent', data);
        for (let index = 0; index < updatedRoom.users.length; index++) {
            let socketInstance = io.sockets.connected[updatedRoom.users[index].userId.toString()];
            if (socketInstance) {
                socketInstance.leave(roomId.toString());
            }
        }
    }
};

module.exports = socketConnection;
