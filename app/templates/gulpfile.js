/* jshint node:true */
"use strict";

var gulp        = require("gulp");
var $           = require("gulp-load-plugins")();

var coffee      = require("gulp-coffee");
var csso        = require("gulp-csso");
var del         = require("del");
var fileinclude = require("gulp-file-include");
var gulpif      = require("gulp-if");
var gutil       = require("gulp-util");
var markdown    = require("markdown");
var minifyHtml  = require("gulp-minify-html");
var minifyCss   = require("gulp-minify-css");
var notify      = require("gulp-notify");
var rev         = require("gulp-rev");
var sass        = require("gulp-ruby-sass");
var shell       = require("gulp-shell");
var size        = require("gulp-size");
var sourcemaps  = require("gulp-sourcemaps");
var useref      = require("gulp-useref");
var wiredep     = require("wiredep").stream;
var usemin      = require("gulp-usemin");
var uglify      = require("gulp-uglify");

gulp.task("clean", function () {

  return del([".tmp", "dist"], function (err, paths) {
      console.log("Deleted files/folders:\n", paths.join("\n"));
  });

});

gulp.task("styles", function () {

  return sass("app/sass/main.scss", { style: "expanded" })
    .pipe(notify({ message: "Compiled Sass" }))
    .pipe($.autoprefixer("last 3 version")).on("error", errorHandler)
    .pipe(notify({ message: "Autoprefixed" }))
    .pipe(gulp.dest(".tmp/css"))
    .pipe(notify({ message: "Copying to Temp Directory" }))
    .pipe(notify({ message: "Styles Complete!"} ))
    .pipe(size());

});

gulp.task("scripts", function() {

  return gulp.src("app/coffeescript/*.coffee")
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

  return gulp.src(["app/*.html"])
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
    .pipe(gulp.dest(".tmp/"));

  return gulp.src(".tmp/js/**")
    .pipe($.plumber())
    .pipe($.jshint())
    .pipe($.jshint.reporter("jshint-stylish"))
    .pipe($.jshint.reporter("fail"))

});

gulp.task("images", function () {

  return gulp.src("app/images/**/*")
    .pipe($.plumber())
    .pipe($.cache($.imagemin({progressive: true, interlaced: true}))).on("error", errorHandler)
    .pipe(gulp.dest(".tmp/img"));

});

gulp.task("fonts", function () {

  return gulp.src(require("main-bower-files")().concat("app/fonts/**/*"))
    .pipe($.plumber())
    .pipe($.filter("**/*.{eot,svg,ttf,woff}")).on("error", errorHandler)
    .pipe($.flatten())
    .pipe(gulp.dest(".tmp/fonts"));

});

gulp.task("extras", function () {

  gulp.src("app/*.txt")
    .pipe($.plumber())
    .pipe(gulp.dest(".tmp/"));

  gulp.src("app/*.ico")
    .pipe($.plumber())
    .pipe(gulp.dest(".tmp/"));

});

gulp.task("connect", ["extras", "fonts", "images", "markup"], function () {
  var serveStatic = require("serve-static");
  var serveIndex = require("serve-index");
  var app = require("connect")()
    .use(require("connect-livereload")({port: 35729}))
    .use(serveStatic(".tmp"))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use("/bower_components", serveStatic("bower_components"))
    .use(serveIndex(".tmp"));

  require("http").createServer(app)
    .listen(9000)
    .on("listening", function () {
      console.log("Started connect web server on http://localhost:9000");
    });

});

gulp.task("serve", ["connect"], function () {
  require("opn")("http://localhost:9000");
});

gulp.task("editor", shell.task([
  "atom ."
]));

gulp.task("git", shell.task([
  "gittower ."
]));

gulp.task("watch", ["editor", "git", "serve"], function () {
  $.livereload.listen();
  gulp.watch(["app/sass/**"], ["markup"]);
  gulp.watch(["app/*.html"], ["markup"]);
  gulp.watch(["app/partials/**"], ["markup"]);
  gulp.watch(["app/coffeescript/**"], ["markup"]);
  gulp.watch(["app/images/**"], ["images"]);
  gulp.watch(".tmp/*").on("change", $.livereload.changed);
});

gulp.task("build-files", ["extras", "fonts", "images", "markup"], function () {

  gulp.src(["bower_components/**/*.{jpg,jpeg,gif,ico,svg,png,css,js}"], { base: "." })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build bower", gzip: true}));

  gulp.src([".tmp/*.html"], { dot: true })
    .pipe($.plumber())
    .pipe(usemin({
      css: [minifyCss(), "concat"],
      html: [minifyHtml({empty: true})],
      js: [uglify(), rev()],
      inlinejs: [uglify()],
      inlinecss: [minifyCss(), "concat"]
    })).on("error", errorHandler)
    .pipe(gulp.dest("dist"))
    .pipe($.size({title: "build html", gzip: true}));

  gulp.src([".tmp/img/**"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/img"))
    .pipe($.size({title: "build images", gzip: true}));

  gulp.src([".tmp/css/*.css"], { dot: true })
    .pipe($.plumber())
    .pipe($.if("*.css", $.csso()))
    .pipe(gulp.dest("dist/css"))
    .pipe($.size({title: "build css", gzip: true}));

  gulp.src([".tmp/js/*.js"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/js"))
    .pipe($.size({title: "build js", gzip: true}));

  gulp.src([".tmp/fonts/**"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/fonts"))
    .pipe($.size({title: "build fonts", gzip: true}));

  gulp.src([".tmp/*.ico"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build favicons", gzip: true}));

  gulp.src([".tmp/*.txt"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build robots and humans", gzip: true}));

});

gulp.task("build", ["clean"], function () {
  gulp.start("build-files");
});

gulp.task("default", function () {
  gulp.start("build");
});

// Handle the error
function errorHandler (error) {
  console.log(error.toString());
  this.emit("end");
}
