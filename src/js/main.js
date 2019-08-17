require('./polyfills/bind_polyfill');
require('./polyfills/classlist_polyfill');
require('./polyfills/animframe_polyfill');
const GameManager = require('./game_manager');
const InputManager = require('./input_manager');
const HTMLView = require('./html_view');
const LocalStorageManager = require('./local_storage_manager');
const strings = require('./strings_de.json');

window.requestAnimationFrame(function () {

  const config = {
    size: 4,
    persistGameState: false,
    strings
  };

  new GameManager(
    window.document.body,
    InputManager,
    HTMLView,
    LocalStorageManager,
    config
  );
});
