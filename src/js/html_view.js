function HTMLView(strings) {
  this.strings = strings;

  this.element = document.createElement('div');
  this.element.classList.add('game2048');

  this.container = document.createElement('div');
  this.container.classList.add('container');
  this.element.append(this.container);

  this.gameContainer = document.createElement("div");
  this.gameContainer.classList.add('game-container');
  this.container.append(this.gameContainer);

  // Message Container
  this.messageContainer = document.createElement('div');
  this.messageContainer.classList.add('game-message');
  this.messageContainerParagraph = document.createElement('p');
  this.messageContainer.append(this.messageContainerParagraph);
  this.gameContainer.append(this.messageContainer);
  // -- Lower
  const lower = document.createElement('div');
  lower.classList.add('lower');
  this.messageContainer.append(lower);
  // ------ Keep playing button
  this.keepPlayingButton = document.createElement('a');
  this.keepPlayingButton.classList.add('keep-playing-button');
  this.keepPlayingButton.textContent = this.strings.KEEP_GOING;
  lower.append(this.keepPlayingButton);
  // ------ Retry button
  this.retryButton = document.createElement('a');
  this.retryButton.classList.add('retry-button');
  this.retryButton.textContent = this.strings.TRY_AGAIN;
  lower.append(this.retryButton);
  this.messageContainer.append(lower);

  // Grid container
  const size = 4;
  const gridContainer = document.createElement('div');
  gridContainer.classList.add('grid-container');
  for (let i=0; i !== size; i += 1) {
    const row = document.createElement('div');
    row.classList.add('grid-row');
    gridContainer.append(row);
    for (let j=0; j !== size; j += 1) {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell');
      row.append(cell);
    }
  }
  this.gameContainer.append(gridContainer);

  //Tile container
  this.tileContainer = document.createElement('div');
  this.tileContainer.classList.add('tile-container');
  this.gameContainer.append(this.tileContainer);

  // Restart button
  this.restartButton = document.createElement('a');
  this.restartButton.classList.add('restart-button');
  this.restartButton.textContent = this.strings.NEW_GAME;
  this.container.append(this.restartButton);

  // Score wrapper
  const scoreWrapper = document.createElement('div');
  scoreWrapper.classList.add('score-wrapper');
  scoreWrapper.classList.add('score-wrapper-score');
  const scoreLabel = document.createElement('div');
  scoreLabel.classList.add('label');
  scoreLabel.textContent = this.strings.SCORE;
  scoreWrapper.append(scoreLabel);
  this.scoreContainer = document.createElement('div');
  this.scoreContainer.classList.add('score-container');
  this.scoreContainer.textContent = '0';
  scoreWrapper.append(this.scoreContainer);
  this.container.append(scoreWrapper);

  // Hi-score wrapper
  const hiScoreWrapper = document.createElement('div');
  hiScoreWrapper.classList.add('score-wrapper');
  hiScoreWrapper.classList.add('score-wrapper-best');
  const hiScoreLabel = document.createElement('div');
  hiScoreLabel.classList.add('label');
  hiScoreLabel.textContent = this.strings.HIGH_SCORE;
  hiScoreWrapper.append(hiScoreLabel);
  this.bestContainer = document.createElement('div');
  this.bestContainer.classList.add('best-container');
  this.bestContainer.textContent = '0';
  hiScoreWrapper.append(this.bestContainer);
  this.container.append(hiScoreWrapper);

  // Help text
  this.helpText = document.createElement('div');
  this.helpText.classList.add('helping-text');
  this.helpText.textContent = this.strings.HELP_TEXT;
  this.container.append(this.helpText);

  // Help hand
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
};

// Continues the game (both restart and keep playing)
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

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  inner.ontouchstart = () => inner.classList.add("hover");
  inner.ontouchend = () => inner.classList.remove("hover");
  inner.ontouchcancel = () => inner.classList.remove("hover");

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLView.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLView.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
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
  var type    = won ? "game-won" : "game-over";
  var message = won ? this.strings.YOU_WIN : this.strings.GAME_OVER;

  this.messageContainer.classList.add(type);
  this.messageContainerParagraph.textContent = message;
};

HTMLView.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLView.prototype.showHelp = function() {
  window.setTimeout((function(){
    this.helpHand.classList.add('shown');
    this.helpText.classList.add('shown');
  }).bind(this), 0);
};

HTMLView.prototype.hideHelp = function() {
  if (this.helpTimeout !== null) {
    window.clearTimeout(this.helpTimeout);
    this.helpTimeout = null;
  }

  this.helpHand.classList.remove('shown');
  this.helpText.classList.remove('shown');
};

HTMLView.prototype.blinkHelp = function() {
  this.hideHelp();
  this.helpTimeout = window.setTimeout(this.hideHelp.bind(this), 6000);
  this.showHelp();
};

HTMLView.prototype.pause = function() {
  this.element.classList.add('paused');
};

HTMLView.prototype.resume = function() {
  this.element.classList.remove('paused');
};

module.exports = HTMLView;
