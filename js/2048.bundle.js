(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var Grid = require('./grid');

var Tile = require('./tile');

function GameManager(container, size, InputManager, View, StorageManager, strings) {
  this.size = size; // Size of the grid

  this.storageManager = new StorageManager();
  this.view = new View(strings);
  container.append(this.view.container);
  this.inputManager = new InputManager();
  this.startTiles = 2;
  this.inputManager.bindGameContainer(this.view.gameContainer);
  this.inputManager.bindRestartButton(this.view.restartButton);
  this.inputManager.bindRestartButton(this.view.retryButton);
  this.inputManager.bindKeepPlayingButton(this.view.keepPlayingButton);
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.helpTimeout = null;
  this.setup();
  this.view.blinkHelp();
} // Restart the game


GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.view.continueGame(); // Clear the game won/lost message

  this.setup();
  this.view.blinkHelp();
}; // Keep playing after winning (allows going over 2048)


GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.view.continueGame(); // Clear the game won/lost message
}; // Return true if the game is lost, or has won and the user hasn't kept playing


GameManager.prototype.isGameTerminated = function () {
  return this.over || this.won && !this.keepPlaying;
}; // Set up the game


GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState(); // Reload the game from a previous game if present

  if (previousState) {
    this.grid = new Grid(previousState.grid.size, previousState.grid.cells); // Reload grid

    this.score = previousState.score;
    this.over = previousState.over;
    this.won = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
  } else {
    this.grid = new Grid(this.size);
    this.score = 0;
    this.over = false;
    this.won = false;
    this.keepPlaying = false; // Add the initial tiles

    this.addStartTiles();
  } // Update the view


  this.actuate();
}; // Set up the initial tiles to start the game with


GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
}; // Adds a tile in a random position


GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);
    this.grid.insertTile(tile);
  }
}; // Sends the updated grid to the view


GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  } // Clear the state when the game is over (game over only, not win)


  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.view.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
    bestScore: this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });
}; // Represent the current game as an object


GameManager.prototype.serialize = function () {
  return {
    grid: this.grid.serialize(),
    score: this.score,
    over: this.over,
    won: this.won,
    keepPlaying: this.keepPlaying
  };
}; // Save all tile positions and remove merger info


GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
}; // Move a tile and its representation


GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
}; // Move tiles on the grid in the specified direction


GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;
  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;
  var vector = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved = false; // Save the current tile positions and remove merger information

  this.prepareTiles(); // Traverse the grid in the right direction and move tiles

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = {
        x: x,
        y: y
      };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next = self.grid.cellContent(positions.next); // Only one merger per row traversal?

        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          self.grid.insertTile(merged);
          self.grid.removeTile(tile); // Converge the two tiles' positions

          tile.updatePosition(positions.next); // Update the score

          self.score += merged.value; // The mighty 2048 tile

          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
}; // Get the vector representing the chosen direction


GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: {
      x: 0,
      y: -1
    },
    // Up
    1: {
      x: 1,
      y: 0
    },
    // Right
    2: {
      x: 0,
      y: 1
    },
    // Down
    3: {
      x: -1,
      y: 0 // Left

    }
  };
  return map[direction];
}; // Build a list of positions to traverse in the right order


GameManager.prototype.buildTraversals = function (vector) {
  var traversals = {
    x: [],
    y: []
  };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  } // Always traverse from the farthest cell in the chosen direction


  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();
  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous; // Progress towards the vector direction until an obstacle is found

  do {
    previous = cell;
    cell = {
      x: previous.x + vector.x,
      y: previous.y + vector.y
    };
  } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required

  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
}; // Check for available matches between tiles (more expensive check)


GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;
  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({
        x: x,
        y: y
      });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell = {
            x: x + vector.x,
            y: y + vector.y
          };
          var other = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

module.exports = GameManager;

},{"./grid":2,"./tile":11}],2:[function(require,module,exports){
"use strict";

var Tile = require('./tile');

function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
} // Build a grid of the specified size


Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
}; // Find the first available random position


Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];
  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({
        x: x,
        y: y
      });
    }
  });
  return cells;
}; // Call callback for every cell


Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
}; // Check if there are any cells available


Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
}; // Check if the specified cell is taken


Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
}; // Inserts a tile at its position


Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};

module.exports = Grid;

},{"./tile":11}],3:[function(require,module,exports){
"use strict";

function HTMLView(strings) {
  this.strings = strings;
  this.container = document.createElement('div');
  this.container.classList.add('container');
  this.gameContainer = document.createElement("div");
  this.gameContainer.classList.add('game-container');
  this.container.append(this.gameContainer); // Message Container

  this.messageContainer = document.createElement('div');
  this.messageContainer.classList.add('game-message');
  this.messageContainerParagraph = document.createElement('p');
  this.messageContainer.append(this.messageContainerParagraph);
  this.gameContainer.append(this.messageContainer); // -- Lower

  var lower = document.createElement('div');
  lower.classList.add('lower');
  this.messageContainer.append(lower); // ------ Keep playing button

  this.keepPlayingButton = document.createElement('a');
  this.keepPlayingButton.classList.add('keep-playing-button');
  this.keepPlayingButton.textContent = this.strings.KEEP_GOING;
  lower.append(this.keepPlayingButton); // ------ Retry button

  this.retryButton = document.createElement('a');
  this.retryButton.classList.add('retry-button');
  this.retryButton.textContent = this.strings.TRY_AGAIN;
  lower.append(this.retryButton);
  this.messageContainer.append(lower); // Grid container

  var size = 4;
  var gridContainer = document.createElement('div');
  gridContainer.classList.add('grid-container');

  for (var i = 0; i !== size; i += 1) {
    var row = document.createElement('div');
    row.classList.add('grid-row');
    gridContainer.append(row);

    for (var j = 0; j !== size; j += 1) {
      var cell = document.createElement('div');
      cell.classList.add('grid-cell');
      row.append(cell);
    }
  }

  this.gameContainer.append(gridContainer); //Tile container

  this.tileContainer = document.createElement('div');
  this.tileContainer.classList.add('tile-container');
  this.gameContainer.append(this.tileContainer); // Restart button

  this.restartButton = document.createElement('a');
  this.restartButton.classList.add('restart-button');
  this.restartButton.textContent = this.strings.NEW_GAME;
  this.container.append(this.restartButton); // Score wrapper

  var scoreWrapper = document.createElement('div');
  scoreWrapper.classList.add('score-wrapper');
  scoreWrapper.classList.add('score-wrapper-score');
  var scoreLabel = document.createElement('div');
  scoreLabel.classList.add('label');
  scoreLabel.textContent = this.strings.SCORE;
  scoreWrapper.append(scoreLabel);
  this.scoreContainer = document.createElement('div');
  this.scoreContainer.classList.add('score-container');
  this.scoreContainer.textContent = '0';
  scoreWrapper.append(this.scoreContainer);
  this.container.append(scoreWrapper); // Hi-score wrapper

  var hiScoreWrapper = document.createElement('div');
  hiScoreWrapper.classList.add('score-wrapper');
  hiScoreWrapper.classList.add('score-wrapper-best');
  var hiScoreLabel = document.createElement('div');
  hiScoreLabel.classList.add('label');
  hiScoreLabel.textContent = this.strings.HIGH_SCORE;
  hiScoreWrapper.append(hiScoreLabel);
  this.bestContainer = document.createElement('div');
  this.bestContainer.classList.add('best-container');
  this.bestContainer.textContent = '0';
  hiScoreWrapper.append(this.bestContainer);
  this.container.append(hiScoreWrapper); // Help text

  this.helpText = document.createElement('div');
  this.helpText.classList.add('helping-text');
  this.helpText.textContent = this.strings.HELP_TEXT;
  this.container.append(this.helpText); // Help hand

  this.helpHand = document.createElement('div');
  this.helpHand.classList.add('helping-hand');
  this.container.append(this.helpHand);
  this.helpTimeout = null;
  this.score = 0;
}

HTMLView.prototype.actuate = function (grid, metadata) {
  var self = this;
  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);
    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });
    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }
  });
}; // Continues the game (both restart and keep playing)


HTMLView.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLView.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLView.prototype.addTile = function (tile) {
  var self = this;
  var wrapper = document.createElement("div");
  var inner = document.createElement("div");
  var position = tile.previousPosition || {
    x: tile.x,
    y: tile.y
  };
  var positionClass = this.positionClass(position); // We can't use classlist because it somehow glitches when replacing classes

  var classes = ["tile", "tile-" + tile.value, positionClass];
  if (tile.value > 2048) classes.push("tile-super");
  this.applyClasses(wrapper, classes);
  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({
        x: tile.x,
        y: tile.y
      });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes); // Render the tiles that merged

    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  } // Add the inner part of the tile to the wrapper


  wrapper.appendChild(inner); // Put the tile on the board

  this.tileContainer.appendChild(wrapper);
};

HTMLView.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLView.prototype.normalizePosition = function (position) {
  return {
    x: position.x + 1,
    y: position.y + 1
  };
};

HTMLView.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLView.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);
  var difference = score - this.score;
  this.score = score;
  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;
    this.scoreContainer.appendChild(addition);
  }
};

HTMLView.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLView.prototype.message = function (won) {
  var type = won ? "game-won" : "game-over";
  var message = won ? this.strings.YOU_WIN : this.strings.GAME_OVER;
  this.messageContainer.classList.add(type);
  this.messageContainerParagraph.textContent = message;
};

HTMLView.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLView.prototype.showHelp = function () {
  window.setTimeout(function () {
    this.helpHand.classList.add('shown');
    this.helpText.classList.add('shown');
  }.bind(this), 0);
};

HTMLView.prototype.hideHelp = function () {
  if (this.helpTimeout !== null) {
    window.clearTimeout(this.helpTimeout);
    this.helpTimeout = null;
  }

  this.helpHand.classList.remove('shown');
  this.helpText.classList.remove('shown');
};

HTMLView.prototype.blinkHelp = function () {
  this.hideHelp();
  this.helpTimeout = window.setTimeout(this.hideHelp.bind(this), 6000);
  this.showHelp();
};

module.exports = HTMLView;

},{}],4:[function(require,module,exports){
"use strict";

function InputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart = "MSPointerDown";
    this.eventTouchmove = "MSPointerMove";
    this.eventTouchend = "MSPointerUp";
  } else {
    this.eventTouchstart = "touchstart";
    this.eventTouchmove = "touchmove";
    this.eventTouchend = "touchend";
  }
}

InputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }

  this.events[event].push(callback);
};

InputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];

  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

InputManager.prototype.bindKeyboard = function () {
  var self = this;
  var map = {
    38: 0,
    // Up
    39: 1,
    // Right
    40: 2,
    // Down
    37: 3,
    // Left
    75: 0,
    // Vim up
    76: 1,
    // Vim right
    74: 2,
    // Vim down
    72: 3,
    // Vim left
    87: 0,
    // W
    68: 1,
    // D
    83: 2,
    // S
    65: 3 // A

  }; // Respond to direction keys

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    var mapped = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    } // R key restarts the game


    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });
};

InputManager.prototype.bindGameContainer = function (gameContainer) {
  var self = this; // Respond to swipe events

  var touchStartClientX, touchStartClientY;
  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if (!window.navigator.msPointerEnabled && event.touches.length > 1 || event.targetTouches.length > 1) {
      return; // Ignore if touching with more than 1 finger
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });
  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });
  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if (!window.navigator.msPointerEnabled && event.touches.length > 0 || event.targetTouches.length > 0) {
      return; // Ignore if still touching with one or more fingers
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);
    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0);
    }
  });
};

InputManager.prototype.bindRestartButton = function (button) {
  this.bindButtonPress(button, this.restart);
};

InputManager.prototype.bindKeepPlayingButton = function (button) {
  this.bindButtonPress(button, this.keepPlaying);
};

InputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

InputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

InputManager.prototype.bindButtonPress = function (button, fn) {
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

module.exports = InputManager;

},{}],5:[function(require,module,exports){
"use strict";

if (window.IMAGINARY === undefined) {
  window.IMAGINARY = {};
}

if (window.IMAGINARY.game2048 === undefined) {
  window.IMAGINARY.game2048 = {};
}

window.IMAGINARY.game2048.fakeStorage = {
  _data: {},
  setItem: function setItem(id, val) {
    return this._data[id] = String(val);
  },
  getItem: function getItem(id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },
  removeItem: function removeItem(id) {
    return delete this._data[id];
  },
  clear: function clear() {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey = "bestScore";
  this.gameStateKey = "gameState";
  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.IMAGINARY.game2048.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";

  try {
    var storage = window.localStorage;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}; // Best score getters/setters


LocalStorageManager.prototype.getBestScore = function () {
  return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
  this.storage.setItem(this.bestScoreKey, score);
}; // Game state getters/setters and clearing


LocalStorageManager.prototype.getGameState = function () {
  var stateJSON = this.storage.getItem(this.gameStateKey);
  return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function (gameState) {
  this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function () {
  this.storage.removeItem(this.gameStateKey);
};

module.exports = LocalStorageManager;

},{}],6:[function(require,module,exports){
"use strict";

require('./polyfills/bind_polyfill');

require('./polyfills/classlist_polyfill');

require('./polyfills/animframe_polyfill');

var GameManager = require('./game_manager');

var InputManager = require('./input_manager');

var HTMLView = require('./html_view');

var LocalStorageManager = require('./local_storage_manager');

var strings = require('./strings_de.json');

window.requestAnimationFrame(function () {
  new GameManager(window.document.body, 4, InputManager, HTMLView, LocalStorageManager, strings);
});

},{"./game_manager":1,"./html_view":3,"./input_manager":4,"./local_storage_manager":5,"./polyfills/animframe_polyfill":7,"./polyfills/bind_polyfill":8,"./polyfills/classlist_polyfill":9,"./strings_de.json":10}],7:[function(require,module,exports){
"use strict";

(function () {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];

  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
})();

},{}],8:[function(require,module,exports){
"use strict";

Function.prototype.bind = Function.prototype.bind || function (target) {
  var self = this;
  return function (args) {
    if (!(args instanceof Array)) {
      args = [args];
    }

    self.apply(target, args);
  };
};

},{}],9:[function(require,module,exports){
"use strict";

(function () {
  if (typeof window.Element === "undefined" || "classList" in document.documentElement) {
    return;
  }

  var prototype = Array.prototype,
      push = prototype.push,
      splice = prototype.splice,
      join = prototype.join;

  function DOMTokenList(el) {
    this.el = el; // The className needs to be trimmed and split on whitespace
    // to retrieve a list of classes.

    var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);

    for (var i = 0; i < classes.length; i++) {
      push.call(this, classes[i]);
    }
  }

  DOMTokenList.prototype = {
    add: function add(token) {
      if (this.contains(token)) return;
      push.call(this, token);
      this.el.className = this.toString();
    },
    contains: function contains(token) {
      return this.el.className.indexOf(token) != -1;
    },
    item: function item(index) {
      return this[index] || null;
    },
    remove: function remove(token) {
      if (!this.contains(token)) return;

      for (var i = 0; i < this.length; i++) {
        if (this[i] == token) break;
      }

      splice.call(this, i, 1);
      this.el.className = this.toString();
    },
    toString: function toString() {
      return join.call(this, ' ');
    },
    toggle: function toggle(token) {
      if (!this.contains(token)) {
        this.add(token);
      } else {
        this.remove(token);
      }

      return this.contains(token);
    }
  };
  window.DOMTokenList = DOMTokenList;

  function defineElementGetter(obj, prop, getter) {
    if (Object.defineProperty) {
      Object.defineProperty(obj, prop, {
        get: getter
      });
    } else {
      obj.__defineGetter__(prop, getter);
    }
  }

  defineElementGetter(HTMLElement.prototype, 'classList', function () {
    return new DOMTokenList(this);
  });
})();

},{}],10:[function(require,module,exports){
module.exports={
  "KEEP_GOING": "Keep going",
  "TRY_AGAIN": "Try again",
  "NEW_GAME": "New Game",
  "SCORE": "Score",
  "HIGH_SCORE": "High Score",
  "HELP_TEXT": "Swipe over the board to merge tiles with the same picture.",
  "YOU_WIN": "You win!",
  "GAME_OVER": "Game over!"
}

},{}],11:[function(require,module,exports){
"use strict";

function Tile(position, value) {
  this.x = position.x;
  this.y = position.y;
  this.value = value || 2;
  this.previousPosition = null;
  this.mergedFrom = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = {
    x: this.x,
    y: this.y
  };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

Tile.prototype.serialize = function () {
  return {
    position: {
      x: this.x,
      y: this.y
    },
    value: this.value
  };
};

module.exports = Tile;

},{}]},{},[6]);
