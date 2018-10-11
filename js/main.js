/*
 * Definition of constants such as Geotab server and database,
 * and global variables such as api to make api calls and 
 * userId to send your id in the calls. Also interval and its rate
 * to make Geotab API calls at a specific rate
 */
const server = "my.geotab.com";
const database = "Skyjack";
const deviceId = "b1";
const rate = 1500;
const messageID = 2457; // 2457 = 0x00000999
var api;
var userId;
var interval;

/*
 * Executes as soon as page loads to show login prompt and set up events
 */
$(document).ready(function () {
    localStorage.clear();
    $('#mdlLogin').modal({
        backdrop: false,
        keyboard: false,
        focus: true
    });
    $('#mdlLogin').modal("show");
    $("#txtUsername").focus();

    $("#btnLogin").on("click", btnLoginClicked);
    $(".tile").on("mousedown touchstart", tileBeingClicked).on("mouseup touchend mouseleave touchleave", tileNotBeingClicked);
});

/*
 * Validates login form when clicking login button before attempting 
 * authenticating to Geotab API
 */
function btnLoginClicked() {
    let username = $("#txtUsername").val();
    let password = $("#txtPassword").val();
    let isValid = true;

    $("#errUsername").html("");
    $("#errPassword").html("");
    if (username == null || username.trim() == "") {
        isValid = false;
        $("#errUsername").html("Username is required.");
        $("#txtUsername").focus();
    } else if (password == null || password.trim() == "") {
        isValid = false;
        $("#errPassword").html("Password is required.");
        $("#txtPassword").focus();
    }

    if (isValid) {
        login(username, password);
    }
}

/*
 * Identifies which tile is being clicked and executes function to adding 
 * TextMessage on Geotab database at a specific rate
 */
function tileBeingClicked(e) {
    e.preventDefault();
    let message = $(this).html();
	switch(message) {
		case "Forward":
			message = "FoAAAAAAAAA="; // 0x 16 80 00 00 00 00 00 00
			break;
		case "Reverse":
			message = "koAAAAAAAAA="; // 0x 92 80 00 00 00 00 00 00
			break;
		case "Left":
			message = "E4AAAAAAAAA="; // 0x 13 80 00 00 00 00 00 00
			break;
		case "Right":
			message = "MoAAAAAAAAA="; // 0x 32 80 00 00 00 00 00 00
			break;
		case "Lift":
			message = "RoAAAAAAAAA="; // 0x 46 80 00 00 00 00 00 00
			break;
		case "Lower":
			message = "woAAAAAAAAA="; // 0x C2 80 00 00 00 00 00 00
			break;
		case "Stop":
			message = "AAAAAAAAAAA="; // 0x 00 00 00 00 00 00 00 00
			break;
	}
    interval = setInterval(function () {
        sendTextMessage(message, messageID);
    }, rate);
}

/*
 * Clears the interval when no tile is being clicked anymore 
 */
function tileNotBeingClicked(e) {
    e.preventDefault();
    clearInterval(interval);
}

/*
 * Authenticates user to Geotab API and immediately retrieves user id 
 * for use in following API calls
 */
function login(username, password) {
    api = GeotabApi(function (authenticateCallback) {
        authenticateCallback(server, database, username, password, function (err) {
            $("#errPassword").html("Username or password is incorrect.");
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
            } else {
                userId = result[0].id;
                $('#mdlLogin').modal("hide");
            }
        }, function (err) {
            console.log("Error: " + err);
        });
    }, false);
}

/*
 * Adds TextMessage object to Geotab database
 */
function sendTextMessage(message, ID) {
    api.call("Add", {
        typeName: "TextMessage",
        entity: {
            isDirectionToVehicle: true,
			activeFrom: "1986-01-01T00:00:00.000Z",
			activeTo: "2050-01-01T00:00:00.000Z",
            device: {
                id: deviceId
            },
            messageContent: {
                contentType: 12,
				channel: 1,
				arbitrationId: ID,
				isAcknowledgeRequired: true,
				extendedFrameFlag: true,
                data: message
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

/*
 * Adds CustomData object to Geotab database
 */
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