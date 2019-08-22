const Hammer = require('hammerjs');

function InputManager() {
  this.events = {};
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
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
      event.shiftKey;
    var mapped = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });
};

InputManager.prototype.bindGameContainer = function (gameContainer) {
  var self = this;

  var mc = new Hammer.Manager(gameContainer);
  mc.add( new Hammer.Swipe() );

  mc.on('swiperight', () => self.emit("move", 1 ));
  mc.on('swipeleft', () => self.emit("move", 3 ));
  mc.on('swipeup', () => self.emit("move", 0 ));
  mc.on('swipedown', () => self.emit("move", 2 ));
};

InputManager.prototype.bindRestartButton = function(button) {
  this.bindButtonPress(button, this.restart);

};

InputManager.prototype.bindKeepPlayingButton = function(button) {
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
