var port = process.argv[2] || 12345; // command line arg
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('public'));

var MAX_NUM_USER = 5;
var MAX_WIDTH = 500;
var MAX_HEIGHT = 500;
var FOOD = null;

// Sample Json format
// var myJson = {"players": {
// 	"id1": {nickname" : "nickname", "color" : "color", "coordinate":[[0,0],[0,1],[0,2]], "direction":"up"},
// 	"id2": {"nickname" : "nickname", "color" : "color", "coordinate":[[1,0], ], "direction":"left"}
// 	}
//  "food": {x:x, y:y}
// };
var clientSockets = [];
var myJson = {"players": []};
var availableColors = ["black","red","yellow","green","blue"];
var colorInUsed = [];
var userArray = new Array();
var currentCoord = [0,0];
var tempNick;
var tempColorIndex;
var tempID;


http.listen(port, function(){
  	console.log('listening on *:'+port);
});

// Feed the index page thwn there is a GET request from client
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

// Feed the index page thwn there is a GET request from client
app.get('/game.html', function(req, res) {
	tempNick = req.query.nickName;
	console.log("New user: " + tempNick);
	res.sendFile(__dirname + '/game.html');
});


io.sockets.on('connection', function(socket){
	clientSockets.push(socket);
	console.log('connected to client:' + socket.id);
	tempID = socket.id;
	console.log("tempID:" + tempID);
	// Assign an id for the new user
	socket.on('join', function(){
		// Assign user an id
		var totalUsers = userArray.length;
		if(totalUsers < MAX_NUM_USER && totalUsers >= 0){
			// Find the good coordinate for the new snake
			// Create the player data and add it to the Json
			userArray.push(tempID);
			var tempJson = {};
			// tempJson.id = tempID;
			tempJson.nickname = tempNick;
			tempJson.color = pickColor();
			tempJson.coordinate = findCoordinate();
			tempJson.direction = findDirection();
			var object = {};
			object[tempID] = tempJson;
			myJson.players.push(object);
			console.log("Create new users: \n\t"+JSON.stringify(tempJson));
			console.log("MyJSON:"+JSON.stringify(myJson));
		}
		// Send game state data to clients
		io.emit('incoming data', myJson);
	});

	// Receiving new key press from the client
	socket.on('key', function(data){
		console.log("Received data:" + data);
		var direction = data.direction;
		console.log("Received direction:" + direction);
		var userID = data.id;
		console.log("MyJSON:"+JSON.stringify(myJson));
		var userJson = myJson.players.userID;
		console.log('receive key action:' + JSON.stringify(data));
		conso
		if(direction === 'up' || direction === 'down' || direction === 'right' || direction === 'left') {
			userJson["direction"] = direction;
		}
		// io.emit('incoming data', currentCoord);
		console.log('updated client data');
	});

	// When the user disconnect
	socket.on('disconnect', function(){
		var socketIndex = clientSockets.indexOf(socket);
		clientSockets.splice(socketIndex,1);
    	console.log('disconnect user: ' + socket.id);
    	gameOver(socket.id);
  });
});

function pickColor(){
	if(availableColors.length > 0){
		var i = randInt(-1,availableColors.length-1);
		var color = availableColors[i];
		availableColors.splice(i,1);
		colorInUsed.push(color);
		return color;
	}
	return "red";
}

//TODO:
//Movement, and broadcast data to clients every 60 ms

function gameOver(socketID){
	return false;
}

function findCoordinate(){
	return [{"x":"1","y":"1"},{"x":"1","y":"2"}];

}

function findDirection(){
	return "right";
}
/////////////////////////////////////////////////////////
// Alfian's space

// Check collision. The board must be up to date and reflects the current position
// of all snakes
var diePlayer = [];
function collision() {
	var all = myJson.players;

	var id;
	for (id in all) {
		var player = all[id];
		var head = player.coordinate[0];

		// rg = right most grid
		// bg = bottom grid
		// TODO: replace rg and bg with correct variable
		// TODO: replace gameOver call with the correct function
		if (head.x == -1 || head.x == rg || head.y == -1 || head.y == bg) {
			gameOver(id);
			continue;
		}

		// TODO: change board to the correct variable name
		var square = board[JSON.stringify(head)].slice();
		// This location should at least have this snake's head
		// if > 1, collision with player happen
		if (square.length > 1) {
			// TODO: update for >2 players collision
			var enemy = square.splice(square.indexOf({'id':id, 'bodyNum': 0}), 0)[0];
			var enemyBody = all[enemy.id].coordinate;
			var eaten = enemyBody.length - enemy.bodyNum;
			if (eaten > player.coordinate.length) {
				// gameOver(id);
				diePlayer.push(id);
			} else {
				// lengthBuffer is the buffered length
				// also used when the snake eats
				// if buffer > 0, instead of moving the tail to the head,
				// we simply extend the head by one until buffer = 0
				player[id].lengthBuffer += eaten;
				if (eaten == enemyBody.length) {
					// gameOver(enemy.id);
					diePlayer.push(enemy.id);
				}
			}
		}
	}	
}


//////////////////////////////////////////////////////////
// Tad's space

// finds a horizontal position on the board at least SPAWN_LEN long.
// Will never spawn head closer than SPAWN_LEN squares away from wall
// returns an ARRAY OF COORDINATES YAY

// This is a very simple approach, it does not take into account
// other snakes near head.
// I figured first entering the game it would be hard
// to dodge a snake even 4-6 spaces in front of you, and I thought
// it would not be worth it to check at all.......................
// Although, with the isOpen(x,y) method, it would not be too hard
// to add this in. It may slow down the algorithm though if there are
// long snakes on the board. Something to consider. Need to see how the
// game plays.. If spawning running into enemies happens often, let's change
var SPAWN_LEN = 5;
function findSpawn(){
	var res = [];
	while (res.length != 0) {
		// Gives them 2x the snake length for the sides. Will spawn them
		// horizontally
		var openSpace = findOpenSquare(SPAWN_LEN * 2, maxX - (SPAWN_LEN * 2),
		 0, maxY - 1);
		res.push(openSpace);
		
		// found open space on the left half of the board. Let's
		// try and extend to the left with head facing right
		if (openSpace.x < (maxX / 2)) {
			while (res.length < SPAWN_LEN) {
				var lastPushed = res[res.length - 1];
				if (isOpen(lastPushed.x - 1, lastPushed.y)) {
					var nextBodyPart = {"x":(lastPushed.x - 1), "y":lastPushed.y};
					res.push(nextBodyPart);
				} else {
					res = [];
					break; // go back around outer loop and find new 
					// starting square.
				}
			}
		} else {
			while (res.length < SPAWN_LEN) {
				var lastPushed = res[res.length - 1];
				if (isOpen(lastPushed.x + 1, lastPushed.y)) {
					var nextBodyPart = {"x":(lastPushed.x + 1), "y":lastPushed.y};
					res.push(nextBodyPart);
				} else {
					res = [];
					break; // go back around outer loop and find new 
					// starting square.
				}
			}
		}
	}
	return res;
}

// Returns direction based on which end the head is facing
function findDirection(playerID) {
	var a = myJson.players[playerID].coordinate;
	if (a[0].x < a[1].x) {
		return "left";
	} else {
		return "right";
	}
}


// adds coordinates in coordArray to board and assigns
// them to the player with the corresponding playerID
function addCoordsToBoard(coordArray, playerID) {
	for (var i = 0; i < coordArray.length; i++) {
		var c = coordArray[i];
		// push into the array at the coordiate
		var ob = {};
		ob["id"] = playerID;
		ob["bodyNum"] = i;
		board[JSON.stringify(c)].push(ob);
	}
}

// Moves each snake based on their direction
// assumes that the head of the snake is snake_array[0]
// and that the tail is snake_array[snake_array.length - 1]
// decrements lengthBuffer and adds one coordinate in snake_array
// as new head else if lengthBuffer = 0 places tail as new head
// as stands, the direction can go back on itself. The game.js
// should restrict movement to not go against its current direction
function move() {
	var all = myJson.players;
	var id;

	for (id in all) {
		var player = all[id];
		var head = player.coordinate[0];

		//The movement code for the snake to come here.
		var d = player.direction;
		var nx = head.x;
		var ny = head.y;
		if(d == "right") nx++;
		else if(d == "left") nx--;
		else if(d == "up") ny--;
		else if(d == "down") ny++;
		var toRemoveFromBoard;
		var toAddToBoard;
		// make the tail the new head
		if (player.lengthBuffer == undefined || player.lengthBuffer == 0) {
			
			var snakeTail = player.coordinate.pop();
			
			toRemoveFromBoard = JSON.stringify(snakeTail);
			var tempArray = board[toRemoveFromBoard];
			for(var i in tempArray){
				if(i.id == id){
					tempArray.slice(i,1);
					break;
				}
			}

			snakeTail.x = nx;
			snakeTail.y = ny;
			player.coordinate.unshift(snakeTail);
			

			toAddToBoard = JSON.stringify(snakeTail);


		// make a new head and unshift onto the player.coordinate array
		} else {
			player.lengthBuffer--;
			var newHead = {
				x:nx,
				y:ny
			};
			player.coordinate.unshift(newHead);


			toAddToBoard = JSON.stringify(newHead);
		}
		updateBoardAfterMove(player.coordinate, id);

		board[toAddToBoard].unshift({id:id, bodyNum:0});
	}
}


// updates board based on moved snake body parts
// does not update board for deleted players.
function updateBoardAfterMove(playerCoords, playerID) {
	var tempArray = playerCoords;
	for(var i in tempArray){
		var boardArr = board[JSON.stringify(tempArray[i])];
		for (var j in boardArr) {
			if (boardArr[j]["id"] == playerID) {
				boardArr[j].bodyNum += 1;
			}
		}
	}
}

// checks the heads of the snakes against the 
// location of the food.
// increments the player's lengthBuffer
// and sets the food to null if the snake eats
// This comes after collision(), so only one snake
// can possibly eat the food
function eat() {
	var all = myJson.players;
	var id;
	var foodCoordinate = JSON.stringify(FOOD);
	var snake = board[foodCoordinate];
	if (snake == undefined || snake == null	|| snake.length == 0) {
		return;
	} else {
		all[snake[0]['id']].lengthBuffer++;
		FOOD = null;
	}

	// check the food coordinate in the board
	// for (id in all) {
	// 	var player = all[id];
	// 	var head = player.coordinate[0];
	// 	if (head.x == FOOD.x && head.y == FOOD.y) {
	// 		player.lengthBuffer++;
	// 		food = null;
	// 		return;
	// 	}
	// }
}

function spawnFood() {
	// TODO: maxX and maxY subject to change
	if (FOOD == null || FOOD == undefined) {
		FOOD = findOpenSquare(0, maxX - 1, 0, maxY - 1);
	}
}

// Finds a coordinate position not currently
// occupied by a player's snake and returns it as an object
// with an x and y field. 
// TODO: ASSUMES maxX and maxY are exclusive. ie. will NEVER
// return {x:max, y:max}
function findOpenSquare(minimumX, maximumX, minimumY, minimumX) {
	// TODO: the global variables maxX maxY and board might
	// have been changed since this was written. Also maxX/maxY
	// is a value that does exist in the board, not one past the edge
	while (true) {
		var potentialX = randInt(minimumX, maximumX - 1);
		var potentialY = randInt(minimumX, maximumY - 1);
		if (isOpen(potentialX, potentialY)) {
			var openSquare = {
				x:potentialX,
				y:potentialY
			};
			return openSquare;
		}
	}
}

// Tests if the coordinates (xval,yval) are occupied by a snake
// note that this does not test agains the food
function isOpen(xval, yval) {
	var testThisCoord = {
		x:xval,
		y:yval
	};
	var str = JSON.stringify(testThisCoord);
	if (board[str] == undefined || board[str].length == 0) {
		return true;
	} else {
		return false;
	}
}

// returns random int between minimum (included) and max (included)
function randInt(minimumInt, maximumInt) {
	return Math.floor(Math.random() * (maximumInt + 1 - minimumInt) + minimumInt);
}


