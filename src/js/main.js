require('./polyfills/bind_polyfill');
require('./polyfills/classlist_polyfill');
require('./polyfills/animframe_polyfill');
const GameManager = require('./game_manager');
const InputManager = require('./input_manager');
const HTMLView = require('./html_view');
const LocalStorageManager = require('./local_storage_manager');
const strings = require('./strings_de.json');

class Game2048 {
  constructor(){
    const config = {
      size: 4,
      persistGameState: false,
      strings
    };

    this.gameManager = new GameManager(
      InputManager,
      HTMLView,
      LocalStorageManager,
      config
    );
  }

  get domElement() {
    return this.gameManager.getElement();
  }

  pause() {
    this.gameManager.pause();
  }

  resume() {
    this.gameManager.resume();
  }

  reset() {
    this.gameManager.restart();
  }
}

module.exports = Game2048;
