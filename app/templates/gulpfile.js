/* jshint node:true */
"use strict";

var gulp = require("gulp");
var $ = require("gulp-load-plugins")();

gulp.task("clean", require("del").bind(null, [".tmp", "dist"]));

gulp.task('styles', function () {
  return gulp.src('app/sass/main.scss')
    .pipe($.plumber())
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10
    }))
    .pipe($.autoprefixer({browsers: ['last 1 version']}))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('connect',['styles'], function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('app'))
    .use(serveStatic('.tmp'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task("watch", ["connect"], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    "app/*.html",
    ".tmp/styles/**/*.css",
    "app/scripts/**/*.js",
    "app/images/**/*"
  ]).on("change", $.livereload.changed);

  gulp.watch("app/styles/**/*.scss", ["styles"]);
  gulp.watch("bower.json", ["wiredep"]);
});

gulp.task("default", ["clean"], function () {
  gulp.start("build");
});
