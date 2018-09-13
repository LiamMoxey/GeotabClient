const server = "my.geotab.com";
const database = "Skyjack";
const user = "Gonzalo.Zuniga@skyjack.com";
const password = "Tenbohourin05+";
const deviceId = "b1";

var api;
var userId;

$(document).ready(function () {
    api = GeotabApi(function (authenticateCallback) {
        authenticateCallback(server, database, user, password, function (err) {
            console.error(err);
        });
    });

    api.getSession(function (credentials, server) {
        api.call("Get", {
            typeName: "User",
            search: {
                name: credentials.userName
            }
        }, function (result) {
            if (!result || !result.length) {
                console.log("Error: No user found with username " + credentials.userName);
            }
            console.log(result[0].id);
            userId = result[0].id;
        }, function (err) {
            console.log("Error: " + err);
        });
    }, false);

    api.call("Get", {
        typeName: "Device"
    }, function (result) {
        if (result !== undefined && result.length) {
            for (let i = 0; i < result.length; i++) {
                console.log(result[i].id + " " + result[i].name);
            }
        } else {
            console.log("Error: No devices found.");
        }
    }, function (err) {
        console.log("Error: " + err);
    });

    $(".tile").on("click", tileClicked);
});

function tileClicked() {
    let message = $(this).html();
    console.log(message);
    //sendMessage(message);
    sendCustomData(message);
}

function sendMessage(message) {
    api.call("Add", {
        typeName: "TextMessage",
        entity: {
            isDirectionToVehicle: true,
            device: {
                id: deviceId
            },
            messageContent: {
                contentType: "Normal",
                message: message
            },
            user: {
                id: userId
            }
        }
    }, function (result) {
        console.log("Success: " + result);
    }, function (err) {
        console.log("Error: " + err);
    });
}

function sendCustomData(message) {
    api.call("Add", {
        typeName: "CustomData",
        entity: {
            data: convertMessageToBinary(message),
            dateTime: new Date().toISOString(),
            device: {
                id: deviceId
            }
        }
    }, function (result) {
        console.log("Success: " + result);
    }, function (err) {
        console.log("Error: " + err);
    });
}

function convertMessageToBinary(message) {
    let output = [];
    for (let i = 0; i < message.length; i++) {
        let bin = message[i].charCodeAt().toString(2);
        output.push(Array(8 - bin.length + 1).join("0") + bin);
    }
    console.log(output);
    console.log(output.join(""));
    return output.join("");
}