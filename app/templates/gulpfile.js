/* jshint node:true */
"use strict";

var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var fileinclude = require("gulp-file-include");
var wiredep = require("wiredep").stream;

gulp.task("clean", require("del").bind(null, [".tmp", "dist"]));

gulp.task("html", function() {
  return gulp.src(["app/*.html"])
  .pipe($.plumber())
  .pipe(fileinclude({prefix: "@@", basepath: "app/partials/"}))
  .pipe(wiredep({directory: "app/bower_components"}))
  .pipe($.usemin())
  .pipe(gulp.dest(".tmp/"))
  .pipe($.size({title: "html", gzip: true}));
});

gulp.task("styles", function () {
  return gulp.src("app/sass/*.scss")
  .pipe($.plumber())
  .pipe($.rubySass({style: "expanded", precision: 10}))
  .pipe($.autoprefixer({browsers: ["last 1 version"]}))
  .pipe(gulp.dest("app/css"));
});

gulp.task("scripts", function() {
  var gutil = require("gulp-util")
  return gulp.src("app/coffeescript/**")
  .pipe($.plumber())
  .pipe($.sourcemaps.init())
  .pipe($.coffee({bare: true}).on("error", gutil.log))
  .pipe($.sourcemaps.write())
  .pipe(gulp.dest("app/js"))
})

gulp.task("images", function () {
  return gulp.src("app/images/**/*")
  .pipe($.plumber())
  .pipe($.cache($.imagemin({progressive: true, interlaced: true})))
  .pipe(gulp.dest("app/img"));
});

gulp.task("connect", ["html", "styles", "scripts"], function () {
  var serveStatic = require("serve-static");
  var serveIndex = require("serve-index");
  var app = require("connect")()
  .use(require("connect-livereload")({port: 35729}))
  .use(serveStatic(".tmp"))
  .use(serveStatic("app"))
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
;

gulp.task("watch", ["serve"], function () {
  $.livereload.listen();
  gulp.watch("app/*.html", "app/partials/**", ["html"]).on("change", $.livereload.changed);
  gulp.watch("app/sass/**/*.scss", ["styles"]).on("change", $.livereload.changed);
  gulp.watch("app/img/**", ["images"]).on("change", $.livereload.changed);
  gulp.watch("app/coffeescript/**/*.coffee", ["scripts"]).on("change", $.livereload.changed);
});

gulp.task("build", ["styles", "scripts", "images", "html"], function () {

  gulp.src([".tmp/*.html"], { dot: true })
  .pipe($.plumber())
  .pipe(gulp.dest("dist"))
  .pipe($.size({title: "build html", gzip: true}));

  gulp.src(["app/img/**"], { dot: true })
  .pipe($.plumber())
  .pipe(gulp.dest("dist/img"))
  .pipe($.size({title: "build images", gzip: true}));

  gulp.src([".tmp/css/**"], { dot: true })
  .pipe($.plumber())
  .pipe($.if("*.css", $.csso()))
  .pipe(gulp.dest("dist/css"))
  .pipe($.size({title: "build css", gzip: true}));

  gulp.src([".tmp/js/**"], { dot: true })
  .pipe($.plumber())
  .pipe(gulp.dest("dist/js"))
  .pipe($.size({title: "build js", gzip: true}));

  gulp.src(["app/fonts/**"], { dot: true })
  .pipe($.plumber())
  .pipe(gulp.dest("dist/fonts"))
  .pipe($.size({title: "build fonts", gzip: true}));

});

gulp.task("default", function () {
  gulp.start("build");
});
