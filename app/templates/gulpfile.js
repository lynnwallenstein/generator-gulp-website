/* jshint node:true */
"use strict";

var gulp = require("gulp");
var $ = require("gulp-load-plugins")();

gulp.task("clean", require("del").bind(null, [".tmp", "dist"]));

gulp.task("html", function() {
  var fileinclude = require("gulp-file-include");
  return gulp.src(["app/*.html"])
    .pipe(fileinclude({prefix: "@@", basepath: "app/partials/"}))
    .pipe(gulp.dest(".tmp/"));
});

gulp.task("styles", function () {
  return gulp.src("app/sass/main.scss")
    .pipe($.plumber())
    .pipe($.rubySass({
      style: "expanded",
      precision: 10
    }))
    .pipe($.autoprefixer({browsers: ["last 1 version"]}))
    .pipe(gulp.dest(".tmp/css"));
});

gulp.task("scripts", function() {
  var gutil = require("gulp-util")
  return gulp.src("app/coffeescript/**/*.coffee")
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.coffee({bare: true}).on("error", gutil.log))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(".tmp/js"))
})

gulp.task("connect", ["html", "styles", "scripts"], function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
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

gulp.task("watch", ["serve"], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    "app/*.html",
    "app/images/**/*"
  ]).on("change", $.livereload.changed);

  gulp.watch("app/sass/**/*.scss", ["styles"]).on("change", $.livereload.changed);
  gulp.watch("app/coffeescript/**/*.coffee", ["scripts"]).on("change", $.livereload.changed);
  gulp.watch("bower.json", ["wiredep"]);
});

gulp.task("default", ["clean"], function () {
  gulp.start("build");
});
