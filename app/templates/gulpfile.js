/* jshint node:true */
"use strict";

var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var gutil = require("gulp-util");
var fileinclude = require("gulp-file-include");
var wiredep = require("wiredep").stream;
var markdown = require("markdown");
var shell = require("gulp-shell")

gulp.task("clean", require("del").bind(null, [".tmp", "dist"]));

gulp.task("styles", function () {

  return gulp.src("app/sass/*.scss")
    .pipe($.plumber())
    .pipe($.rubySass({style: "expanded", precision: 10}))
    .pipe($.autoprefixer({browsers: ["last 3 versions"]}))
    .pipe(gulp.dest("app/css"));

});

gulp.task("scripts", function() {

  return gulp.src("app/coffeescript/**")
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.coffee({bare: true}).on("error", gutil.log))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest("app/js"));

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
    }))
    .pipe(wiredep({directory: "bower_components"}))
    .pipe($.usemin({
      css: [$.minifyCss(), $.rev()],
      html: [$.minifyHtml({empty: true})],
      js: [$.uglify(), $.rev()]
    }))
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
    .pipe($.cache($.imagemin({progressive: true, interlaced: true})))
    .pipe(gulp.dest(".tmp/img"));

});

gulp.task("fonts", function () {

  return gulp.src(require("main-bower-files")().concat("app/fonts/**/*"))
    .pipe($.plumber())
    .pipe($.filter("**/*.{eot,svg,ttf,woff}"))
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

gulp.task("editor", shell.task(["atom ."]))

gulp.task("git", shell.task(["gittower ."]))

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

  gulp.src(["bower_components/**"], { base: "." })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/"))
    .pipe($.size({title: "build bower", gzip: true}));

  gulp.src([".tmp/*.html"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist"))
    .pipe($.size({title: "build html", gzip: true}));

  gulp.src([".tmp/img/**"], { dot: true })
    .pipe($.plumber())
    .pipe(gulp.dest("dist/img"))
    .pipe($.size({title: "build images", gzip: true}));

  gulp.src([".tmp/css/*-*.css"], { dot: true })
    .pipe($.plumber())
    .pipe($.if("*.css", $.csso()))
    .pipe(gulp.dest("dist/css"))
    .pipe($.size({title: "build css", gzip: true}));

  gulp.src([".tmp/js/*-*.js"], { dot: true })
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
