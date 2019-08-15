var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var paths = {
  styles: {
    src: './src/sass/**/*.scss',
    dest: './style',
  },
  scripts: {
    src: './src/js/*.js',
    dest: './js',
  },
};


function scripts() {
  return browserify({
    extensions: ['.js'],
    entries: './src/js/main.js',
  })
    .transform('babelify', { presets: ['@babel/env'] })
    .on('error', function(msg) {
      console.error(msg);
    })
    .bundle()
    .pipe(source('2048.bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(uglify())
    .pipe(rename('2048.bundle.min.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.scripts.dest));
}

function styles() {
  return gulp.src(paths.styles.src, { sourcemaps: true })
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.dest));
}

function watch() {
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
}

var build = gulp.parallel(styles, scripts);

exports.styles = styles;
exports.scripts = scripts;
exports.watch = watch;

exports.build = build;
exports.default = build;
