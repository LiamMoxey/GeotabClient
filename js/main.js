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
    console.log(interval);
    $(".tile").on("mousedown", tileBeingClicked).on("mouseup mouseleave", tileNotBeingClicked);
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
function tileBeingClicked() {
    let message = $(this).html();
    interval = setInterval(function () {
        sendTextMessage(message);
    }, rate);
}

/*
 * Clears the interval when no tile is being clicked anymore 
 */
function tileNotBeingClicked() {
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
function sendTextMessage(message) {
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