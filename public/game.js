//The main update loop runs on requestAnimationFrame,
//Which falls back to a setTimeout loop on the server
//Code below is from Three.js, and sourced from links below

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel

( function () {

    var lastTime = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }

    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function ( callback, element ) {
            var currTime = Date.now(), timeToCall = Math.max( 0, frame_time - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
    }

}() );

var socket = io();
var canvas = document.getElementById('gameField');
var context = canvas.getContext('2d');
var gridSize = 6;
var die = false;

// an object stores basic info of player: id, nickName, current direction
var client = {};
client["nickName"] = null;
client["id"] = null;
client["direction"] = null;

// div tags of index.html
var signUpDiv = $('#signUp');
var gameBoardDiv = $('#gameBoard');
var controlsDiv = $('#controls');
var scoreDiv = $('#score');

// request to join the game, starts when load the page
$(document).ready(function(){
  $('#photos').hide();
  $('#gameover').hide();
  signUpDiv.show();
  gameBoardDiv.hide();
  controlsDiv.hide();
  scoreDiv.hide();

  $('#photos').fadeIn(1000).delay(500).fadeOut(4500);
});

$('#join').click(function(){
  var nn = $("#nickName").val();
  if(nn != ""){
    client.nickName = nn;
    client.id = newID();
    socket.emit('join',client);
  }
});

// receive the player's info from the server, use this to set diretion for
// client object
socket.on('confirm join', function(initialDirection){
  if(initialDirection != undefined){
    client.direction = initialDirection;
    signUpDiv.hide();
    gameBoardDiv.show();
    scoreDiv.show();
    if($('#useOnScreen').is(':checked')){
      controlsDiv.show();
    }
  }
});

// receive game over signal
socket.on('game over', function(){
    $("#gameover").fadeIn(3000);

    die = true;
    var nextTime = new Date().getTime();
    var alpha = 0;
    var pace = 1000;
    function fade(){
      if(new Date().getTime() > nextTime){
        nextTime = new Date().getTime() + pace;
       
        if(alpha > 0.5){
          alpha = 0;
        }
        
        alpha = (alpha * 100 + 1)/100;
        
      }

      context.fillStyle = "black";
      context.globalAlpha = alpha;
      context.fillRect(0,0,600,600);
      requestAnimationFrame(fade);
    }

    fade();
});

// when player hits a key, combine the current and the keypress
// then send the non-conflict key to the server
$(document).keydown(function(e){
  var charCode = (e.which) ? e.which : e.keyCode;
  if(client.id != null && client.nickName != null && client.direction != null){
    if(charCode === 38 || charCode === 87) {
    // Up arrow
      sendKey('up');
    } else if(charCode === 40 || charCode === 83) {
    // Down arrow
      sendKey('down');
    } else if(charCode === 39 || charCode === 68) {
    // Right arrow
      sendKey('right');
    } else if(charCode === 37 || charCode === 65) {
    // Left arrow
      sendKey('left');
    }
  }
});

// send key when on screen keyboard is hit
$('#upKey').click(function() {
  sendKey('up');
});

$('#downKey').click(function() {
  sendKey('down');
});

$('#leftKey').click(function() {
  sendKey('left');
});

$('#rightKey').click(function() {
  sendKey('right');
});


// receive updates from the server, use this to render the snakes and food
socket.on('incoming data', function(data){
  if(data != undefined && !die) {
    resetCanvas();
    // render the food
    if(data.food != undefined){
      display(data.food.coordinate, data.food.color);
    }
    // render the players
    for(var player in data.players){
      // get the info of current Player and the scoreBoard to display
      if(player == client.id){
        var gameInfo = {};
        gameInfo.nickName = data.players[player].nickname;
        gameInfo.color = data.players[player].color;
        gameInfo.size = data.players[player].coordinate.length;
        gameInfo.scoreBoard = data.scoreBoard;
        displayScoreBoard(gameInfo);
      }
      var p = data.players[player];
      render(p.color, p.coordinate, p.nickname);
      console.log("id:"+client.id+"\t nick:"+client.snickName);
    }
  }
});

// take a coordinate array of a player, and color to render a snake
function render(color, coordinates, nick){
  for(var i in coordinates){
    display(coordinates[i], color);
  }

  context.font = "8px Courier New";
  var xPos = coordinates[0].x *gridSize,
      yPos = coordinates[0].y * gridSize -3;

  xPos += (client.direction === "right") ? -15 : 10;
  context.fillText(nick, xPos, yPos);

}

// plot a cell on canvas using the given coordinate obj {x:y} and color
function display(coordinate, color) {
  context.fillStyle = color;
  context.fillRect(coordinate.x * gridSize, coordinate.y * gridSize, gridSize, gridSize);
  context.strokeStyle = "white";
  context.strokeRect(coordinate.x * gridSize, coordinate.y * gridSize, gridSize, gridSize);
}

function displayScoreBoard(data){
  if(data){
    var playerInfo = $('#playerInfo');
    playerInfo.empty();
    playerInfo.append('<span>&#8718;</span> ' + data.nickName + ' (' + data.size + ')');
    playerInfo.css("color", data.color);

    var scoreList = $('#scoreList');
    scoreList.empty();
    scoreList.append('<tr><td colspan="2"><b><u>Highest Scores</u><b></td></tr>')
    scoreList.append('<tr><th>Player</th><th>Score</th></tr>');
    for(var i in data.scoreBoard) {
      var cur = Object.keys(data.scoreBoard[i])[0];
      scoreList.append('<tr><td>' + cur + '</td><td> ' + data.scoreBoard[i][cur] + '</td></tr>');
    }


  }
}

// reset the canvas before redraw the new state of the game
function resetCanvas(){
  // Reset the canvas
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  context.clearRect(0,0,width, height);
}

// create a uniqe id
function newID(){
  var randomlyGeneratedUID = Math.random().toString(36).substring(3,16)+ +new Date;
  return randomlyGeneratedUID;
}

function sendKey(key){
  if(client.id != null && client.nickName != null && client.direction != null){
    var data = {};
    data.id = client.id;
    if( key =='up' && client.direction != 'down' && client.direction != 'up') {
    // Up arrow
      data.direction = 'up';
      client.direction = 'up';
    } else if( key == 'down' && client.direction != 'up' && client.direction != 'down') {
    // Down arrow
      data.direction = 'down';
      client.direction = 'down';
    } else if( key == 'right' && client.direction != 'left' && client.direction != 'right') {
    // Right arrow
      data.direction = 'right';
      client.direction = 'right';
    } else if( key == 'left' && client.direction != 'right' && client.direction != 'left') {
    // Left arrow
      data.direction = 'left';
      client.direction = 'left';
    }
    socket.emit('key',data);
  }
}


// Slideshow for front page
var imgs = ['images/1.jpg', 'images/2.jpg', 'images/3.jpg', 'images/4.png', 'images/5.png'];
$(function() {
  var i = 0;
  // $('#photos').fadeOut(4500);
  setInterval(function() {
    $('#photos').attr('src',imgs[i])
      .fadeIn(2500)
      .delay(500)
      .fadeOut(3000)
      if(i == imgs.length-1) {
        i = 0;
      } else {
        i++;
      }
  },  6000);

});
