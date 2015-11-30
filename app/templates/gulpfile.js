/* jshint node:true */
"use strict";

var gulp        = require("gulp");
var $           = require("gulp-load-plugins")();

var browserSync = require('browser-sync').create();
var coffee      = require("gulp-coffee");
var csso        = require("gulp-csso");
var del         = require("del");
var debug       = require("gulp-debug")
var fileinclude = require("gulp-file-include");
var gulpif      = require("gulp-if");
var gutil       = require("gulp-util");
var markdown    = require("markdown");
var minifyHtml  = require("gulp-minify-html");
var minifyCss   = require("gulp-minify-css");
var notify      = require("gulp-notify");
var sass        = require("gulp-ruby-sass");
var shell       = require("gulp-shell");
var size        = require("gulp-size");
var sourcemaps  = require("gulp-sourcemaps");
var useref      = require("gulp-useref");
var wiredep     = require("wiredep").stream;
var usemin      = require("gulp-usemin");
var uglify      = require("gulp-uglify");
var using       = require("gulp-using");

gulp.task("clean", function () {

  del([".tmp", "dist"])

});

gulp.task("styles", function () {

  return sass("app/sass/main.scss", { style: "expanded" })
    .pipe(using())
    .pipe(notify({ message: "Compiled Sass" }))
    .pipe($.autoprefixer("last 3 versions")).on("error", errorHandler)
    .pipe(notify({ message: "Autoprefixed" }))
    .pipe(gulp.dest(".tmp/css"))
    .pipe(notify({ message: "Copying to Temp Directory" }))
    .pipe(notify({ message: "Styles Complete!"} ))
    .pipe(size());

});

gulp.task("scripts", function() {

  return gulp.src("app/coffeescript/*.coffee")
    .pipe(using())
    .pipe(sourcemaps.init()).on("error", errorHandler)
    .pipe(notify({ message: "Sourcemaps Initialized" }))
    .pipe(coffee({bare: true})).on("error", errorHandler)
    .pipe(notify({ message: "Compiled CoffeeScript" }))
    .pipe(sourcemaps.write()).on("error", errorHandler)
    .pipe(notify({ message: "Writing Sourcemaps" }))
    .pipe(gulp.dest(".tmp/js"))
    .pipe(notify({ message: "Copyting to app/js" }))
    .pipe(size());

})

gulp.task("markup", ["styles", "scripts"], function () {

  gulp.src(["app/*.html"])
    .pipe(using())
    .pipe($.plumber())
    .pipe(fileinclude({
      prefix: "@@",
      basepath: "app/partials/",
      filters: {
        markdown: markdown.parse
      }
    })).on("error", errorHandler)
    .pipe(notify({ message: "Partial Include and Markdown Parsing" }))
    .pipe(wiredep({directory: "bower_components"})).on("error", errorHandler)
    .pipe(notify({ message: "Wiring Up Bower Components" }))
    .pipe(gulp.dest(".tmp/"))
    .pipe(browserSync.stream());

  gulp.src(".tmp/js/**")
    .pipe(using())
    .pipe($.plumber())
    //.pipe($.jshint())
    //.pipe($.jshint.reporter("jshint-stylish"))
    //.pipe($.jshint.reporter("fail"))
    .pipe(browserSync.stream());

});

gulp.task("images", function () {

  return gulp.src("app/images/**/*")
    .pipe(using())
    .pipe($.plumber())
    .pipe($.cache($.imagemin({progressive: true, interlaced: true}))).on("error", errorHandler)
    .pipe(gulp.dest(".tmp/img"))
    .pipe(browserSync.stream());

});

gulp.task("fonts", function () {

  return gulp.src(require("main-bower-files")().concat("app/fonts/**/*"))
    .pipe(using())
    .pipe($.plumber())
    .pipe($.filter("**/*.{eot,svg,ttf,woff}")).on("error", errorHandler)
    .pipe($.flatten())
    .pipe(gulp.dest(".tmp/fonts"))
    .pipe(browserSync.stream());

});

gulp.task("extras", function () {

  gulp.src("app/*.txt")
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest(".tmp/"))
    .pipe(browserSync.stream());

  gulp.src("app/*.ico")
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest(".tmp/"))
    .pipe(browserSync.stream());

});

// Static Server + watching scss/html files
gulp.task("watch", ["extras", "fonts", "images", "markup", "editor", "git", "open-browser"], function() {

    browserSync.init({
      server: ".tmp",
      port: "9000"
    });

    gulp.watch(["app/sass/**"], ["markup"]);
    gulp.watch(["app/*.html"], ["markup"]);
    gulp.watch(["app/partials/**"], ["markup"]);
    gulp.watch(["app/coffeescript/**"], ["markup"]);
    gulp.watch(["app/images/**"], ["images"]);
    gulp.watch(".tmp/*").on("change", browserSync.reload);

});

gulp.task("open-browser", function () {
  require("opn")("http://localhost:9000");
});

gulp.task("editor", shell.task([
  "atom ."
]));

gulp.task("git", shell.task([
  "gittower ."
]));


gulp.task("build-files", ["extras", "fonts", "images", "markup"], function () {

  gulp.src(["bower_components/**/*.{jpg,jpeg,gif,ico,svg,png}"], { base: "." })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build bower", gzip: true}));

  gulp.src([".tmp/*.html"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(usemin({
      css: [minifyCss, "concat"],
      html: [minifyHtml({empty: true})],
      js: [uglify],
      inlinejs: [uglify],
      inlinecss: [minifyCss, "concat"]
    })).on("error", errorHandler)
    .pipe(gulp.dest("dist"))
    .pipe($.size({title: "build html", gzip: true}));

  gulp.src([".tmp/img/**"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/img"))
    .pipe($.size({title: "build images", gzip: true}));

  gulp.src([".tmp/css/*.css"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe($.if("*.css", $.csso()))
    .pipe(gulp.dest("dist/css"))
    .pipe($.size({title: "build css", gzip: true}));

  gulp.src([".tmp/js/*.js"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/js"))
    .pipe($.size({title: "build js", gzip: true}));

  gulp.src([".tmp/fonts/**"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/fonts"))
    .pipe($.size({title: "build fonts", gzip: true}));

  gulp.src([".tmp/*.ico"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build favicons", gzip: true}));

  gulp.src([".tmp/*.txt"], { dot: true })
    .pipe(using())
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build robots and humans", gzip: true}));

});

gulp.task("build-prep", ["clean"], function () {

  gulp.start("build-files");

});

// Static Server + watching scss/html files
gulp.task("build-test-server", ["build-prep"], function() {

    browserSync.init({
        server: "dist",
        port: "9001"
    });

});

gulp.task("build", ["build-test-server"], function () {
  require("opn")("http://localhost:9001");
});

gulp.task("default", function () {
  gulp.start("watch");
});

// Handle the error
function errorHandler (error) {
  console.log(error.toString());
  this.emit("end");
}
