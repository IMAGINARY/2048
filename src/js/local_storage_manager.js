const EventEmitter = require('events');

if (window.IMAGINARY === undefined) {
  window.IMAGINARY = {};
}

if (window.IMAGINARY.game2048 === undefined) {
  window.IMAGINARY.game2048 = {};
}

window.IMAGINARY.game2048.events = new EventEmitter();

window.IMAGINARY.game2048.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.bestScoreKey     = "IMAGINARY.game2048.bestScore";
  this.bestScoreDateKey     = "IMAGINARY.game2048.bestScoreDate";
  this.gameStateKey     = "IMAGINARY.game2048.gameState";

  var supported = this.localStorageSupported();
  this.storage = supported ?
    window.localStorage :
    window.IMAGINARY.game2048.fakeStorage;
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
};

LocalStorageManager.prototype.getCurrentDate = function() {
  const now = new Date();
  const pad2 = (number) => number.toString().padStart(2, '0');
  return [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate())
  ].join('-');
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function () {
  const bestDate = this.storage.getItem(this.bestScoreDateKey);
  if (bestDate === this.getCurrentDate()) {
    return this.storage.getItem(this.bestScoreKey) || 0;
  }
  return 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
  this.storage.setItem(this.bestScoreDateKey, this.getCurrentDate());
  this.storage.setItem(this.bestScoreKey, score);
  window.IMAGINARY.game2048.events.emit('newHighScore', score);
};

// Game state getters/setters and clearing
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

LocalStorageManager.prototype.on = function(...args) {
  return window.IMAGINARY.game2048.events.on(...args);
};


module.exports = LocalStorageManager;
