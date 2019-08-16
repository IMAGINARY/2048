const GameManager = require('./game_manager');
const InputManager = require('./input_manager');
const HTMLView = require('./html_view');
const LocalStorageManager = require('./local_storage_manager');
const strings = require('./strings_de.json');

window.requestAnimationFrame(function () {
  new GameManager(
    window.document.body,
    4,
    InputManager,
    HTMLView,
    LocalStorageManager,
    strings
  );
});
