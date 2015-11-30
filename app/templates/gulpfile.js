/* jshint node:true */
"use strict";

var basePaths = {
    src: "src/",
    dev: "serve/",
    dist: "dist/",
    bower: "bower_components/"
};

var paths = {
  images: {
    src: basePaths.src + "images/",
    dev: basePaths.dev + "img/",
    dist: basePaths.dist + "img/"
  },
  scripts: {
    src: basePaths.src + "coffeescript/",
    dev: basePaths.dev + "js/",
    dist: basePaths.dist + "js/"
  },
  styles: {
    src: basePaths.src + "sass/",
    dev: basePaths.dev + "css/",
    dist: basePaths.dist + "css/"
  },
  fonts: {
    src: basePaths.src + "fonts/",
    dev: basePaths.dev + "fonts/",
    dist: basePaths.dist + "fonts/"
  },
  partials: {
    dev: basePaths.src + "partials/"
  }
};

var gulp            = require("gulp");
var $               = require("gulp-load-plugins")();

var browserSync     = require("browser-sync").create();
var del             = require("del");
var debug           = require("gulp-debug")
var fileinclude     = require("gulp-file-include");
var gulpFilter      = require("gulp-filter");
var gulpif          = require("gulp-if");
var gutil           = require("gulp-util");
var mainBowerFiles  = require('gulp-main-bower-files');
var markdown        = require("markdown");
var minifyHtml      = require("gulp-minify-html");
var minifyCss       = require("gulp-minify-css");
var sass            = require("gulp-ruby-sass");
var shell           = require("gulp-shell");;
var usemin          = require("gulp-usemin");
var uglify          = require("gulp-uglify");

gulp.task("clean", function () {

  del([basePaths.dev, basePaths.dist])

});

gulp.task("styles", function () {

  return sass(paths.styles.src + "main.scss", { style: "expanded" })
    .pipe($.using())
    .pipe($.notify({ message: "Compiled Sass" }))
    .pipe($.autoprefixer("last 3 versions")).on("error", errorHandler)
    .pipe($.notify({ message: "Autoprefixed" }))
    .pipe(gulp.dest(paths.styles.dev))
    .pipe($.notify({ message: "Copying to Dev Server Directory" }))
    .pipe($.notify({ message: "Styles Complete!"} ))
    .pipe($.size());

});

gulp.task("scripts", function() {

  return gulp.src(paths.scripts.src + "*.coffee")
    .pipe($.using())
    .pipe($.sourcemaps.init()).on("error", errorHandler)
    .pipe($.notify({ message: "Sourcemaps Initialized" }))
    .pipe($.coffee({bare: true})).on("error", errorHandler)
    .pipe($.notify({ message: "Compiled CoffeeScript" }))
    .pipe($.sourcemaps.write()).on("error", errorHandler)
    .pipe($.notify({ message: "Writing Sourcemaps" }))
    .pipe(gulp.dest(paths.scripts.dev))
    .pipe($.notify({ message: "Copyting to app/js" }))
    .pipe($.size());

})

gulp.task("markup", ["styles", "scripts"], function () {
  var assets = $.useref.assets({searchPath: paths.scripts.dev});

  gulp.src([basePaths.src + "*.html"])
    .pipe($.using())
    .pipe(assets)
    .pipe(fileinclude({
      prefix: "@@",
      basepath: paths.partials.dev,
      filters: {
        markdown: markdown.parse
      }
    })).on("error", errorHandler)
    .pipe($.notify({ message: "Partial Include and Markdown Parsing" }))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.notify({ message: "Wiring Up Bower Components" }))
    .pipe(gulp.dest(basePaths.dev))
    .pipe(browserSync.stream());

  gulp.src(paths.scripts.dev + "**")
    .pipe($.using())
    .pipe($.plumber())
    //.pipe($.jshint())
    //.pipe($.jshint.reporter("jshint-stylish"))
    //.pipe($.jshint.reporter("fail"))
    .pipe(browserSync.stream());

});

gulp.task("images", function () {

  return gulp.src(paths.images.src + "**/*")
    .pipe($.using())
    .pipe($.newer(paths.images.dev))
    .pipe($.imagemin({progressive: true, interlaced: true})).on("error", errorHandler)
    .pipe(gulp.dest(paths.images.dev))
    .pipe(browserSync.stream());

});

gulp.task("fonts", function () {

  var filterFonts = gulpFilter("**/*.{eot,svg,ttf,woff}", { restore: true });
  return gulp.src("./bower.json")
    .pipe(mainBowerFiles())
    .pipe(filterFonts)
    .pipe(gulp.dest(paths.fonts.dev))
    .pipe(browserSync.stream());

});

gulp.task("extras", function () {

  gulp.src(basePaths.src + "*.txt")
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(basePaths.dev))
    .pipe(browserSync.stream());

  gulp.src(basePaths.src + "*.ico")
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(basePaths.dev))
    .pipe(browserSync.stream());

});

// Static Server + watching scss/html files
gulp.task("watch", ["extras", "fonts", "images", "markup", "editor", "git"], function() {

    browserSync.init({
      server: {
        baseDir: basePaths.dev,
        routes: {
            "/bower_components": "bower_components"
        }
      },
      port: "9000",
      browser: "google chrome"
    });

    gulp.watch([paths.styles.src + "**"], ["markup"]);
    gulp.watch([basePaths.src + "*.html"], ["markup"]);
    gulp.watch([paths.partials.dev + "**"], ["markup"]);
    gulp.watch([paths.scripts.src + "**"], ["markup"]);
    gulp.watch([paths.images.src + "**"], ["images"]);
    gulp.watch(basePaths.src + "*").on("change", browserSync.reload);

});

gulp.task("editor", shell.task([
  "atom ."
]));

gulp.task("git", shell.task([
  "gittower ."
]));


gulp.task("publish-files", ["extras", "fonts", "images", "markup"], function () {

  gulp.src([basePaths.bower + "**/*.{jpg,jpeg,gif,ico,svg,png,js,css}"], { base: "." })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(basePaths.dist))
    .pipe($.size({title: "build bower", gzip: true}));

  gulp.src([basePaths.dev + "*.html"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(usemin({
      css: [minifyCss, "concat"],
      html: [minifyHtml({empty: true})],
      js: [uglify],
      inlinejs: [uglify],
      inlinecss: [minifyCss, "concat"]
    })).on("error", errorHandler)
    .pipe(gulp.dest(basePaths.dist))
    .pipe($.size({title: "build html", gzip: true}));

  gulp.src([paths.images.dev + "**"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(paths.images.dist))
    .pipe($.size({title: "build images", gzip: true}));

  gulp.src([paths.styles.dev + "*.css"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe($.if("*.css", $.csso()))
    .pipe(gulp.dest(paths.styles.dist))
    .pipe($.size({title: "build css", gzip: true}));

  gulp.src([paths.scripts.dev + "*.js"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(paths.scripts.dist))
    .pipe($.size({title: "build js", gzip: true}));

  gulp.src([paths.fonts.dev + "**"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(paths.fonts.dist))
    .pipe($.size({title: "build fonts", gzip: true}));

  gulp.src([basePaths.dev + "*.ico"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(basePaths.dist))
    .pipe($.size({title: "build favicons", gzip: true}));

  gulp.src([basePaths.dev + "*.txt"], { dot: true })
    .pipe($.using())
    .pipe($.plumber())
    .pipe(gulp.dest(basePaths.dist))
    .pipe($.size({title: "build robots and humans", gzip: true}));

});

gulp.task("publish-prep", ["clean"], function () {

  gulp.start("publish-files");

});

// Static Server + watching scss/html files
gulp.task("publish", ["publish-prep"], function() {

    browserSync.init({
      server: {
        baseDir: basePaths.dist
      },
      port: "9001",
      browser: "google chrome"
    });

});

gulp.task("default", function () {
  gulp.start("watch");
});

// Handle the error
function errorHandler (error) {
  console.log(error.toString());
  this.emit("end");
}
