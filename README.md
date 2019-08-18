# 2048
An adaptation of the [2048](https://github.com/gabrielecirulli/2048) game by Gabriel Cirulli for the  Mathematikon Content Slider.

Adapted by [Eric Londaits](mailto:eric.londaits@imaginary.org) for IMAGINARY gGmbH.

The tile images were created with [SURFER](http://imaginary.org/program/surfer) by [Bianca Violet](mailto:bianca.violet@imaginary.org) based on equations by [Oliver Labs](http://www.oliverlabs.net/).

## Interface

The game can either be imported as an ES6 library or accessed through the global `window.Game2048` within the
browser.

```
const Game2048 = require('game2048');
```

to build the game just create an instance and append it to a DOM Element:

```
const game = new Game2048();
window.document.body.append(game.domElement);
```

### Methods

- **reset()**: Restarts the game (same as pressing the 'New game' button).
- **pause()**: Pauses the game's animations.
- **resume()**: Resumes the game's animations.

## Notes on this adaptation

This adaptation was done for the very specific requirements of the Mathematikon Content Slider:

- Surfer based tile images.
- 1560 x 1170 container without scrolling.
- No title or unnecesary text on the screen.
- German language.
- The game shouldn't pollute the JS global namespace.
- All CSS styles should apply only within the game container.
- Two instances of the game should run independenty within the same DOM tree (without using iframes).
- Methods for restarting, pausing and resuming the app.

With those requirements and having little time to adapt the spirit of the adaptation was to only support that use case and not worry about:

- Other languages.
- Other resolutions.
- Mobile support.
- Cross browser compatibility.

... but trying not to unnecessarily break things that might help support any of these in the future. In that spirit some things were left commented out or unused, such as the responsive CSS styles or the english language strings. 

## Credits

2048 by Gabriel Cirulli is a small clone of [1024](https://play.google.com/store/apps/details?id=com.veewo.a1024), based on [Saming's 2048](http://saming.fr/p/2048/) (also a clone).

### Gabriel Cirulli's credits

[Anna Harren](https://github.com/iirelu/) and [sigod](https://github.com/sigod) are maintainers for this repository.

Other notable contributors:

 - [TimPetricola](https://github.com/TimPetricola) added best score storage
 - [chrisprice](https://github.com/chrisprice) added custom code for swipe handling on mobile
 - [marcingajda](https://github.com/marcingajda) made swipes work on Windows Phone
 - [mgarciaisaia](https://github.com/mgarciaisaia) added support for Android 2.3

Many thanks to [rayhaanj](https://github.com/rayhaanj), [Mechazawa](https://github.com/Mechazawa), [grant](https://github.com/grant), [remram44](https://github.com/remram44) and [ghoullier](https://github.com/ghoullier) for the many other good contributions.

## License
2048 is licensed under the [MIT license.](https://github.com/gabrielecirulli/2048/blob/master/LICENSE.txt)
