"use strict";

var basePaths = {
    src: "src/"
};

var join   = require("path").join;
var yeoman = require("yeoman-generator");
var yosay  = require("yosay");
var chalk  = require("chalk");

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);
    this.pkg = require("../package.json");
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      "Welcome Lynn's Yeoman web site generator!"
    ));

    var prompts = [{
      name: "websiteName",
      message: "What is your website's name?",
      default: "website"
    }];

    this.prompt(prompts, function (answers) {
      this.websiteName = answers.websiteName;
      done();
    }.bind(this));
  },

  gulpfile: function() {
    this.template("gulpfile.js");
  },

  app: function () {
    this.directory(basePaths.src);

    this.directory("_partials", basePaths.src + "partials");
    this.directory("_sass", basePaths.src + "sass");
    this.directory("_coffeescript", basePaths.src + "coffeescript");
    this.directory("_images", basePaths.src + "images");
    this.directory("_fonts", basePaths.src + "fonts");

    this.copy("favicon.ico",      basePaths.src + "favicon.ico");
    this.copy("robots.txt",       basePaths.src + "robots.txt");
    this.copy("humans.txt",       basePaths.src + "humans.txt");
    this.copy("_Gemfile",         "Gemfile");
    this.copy("_gitignore",       ".gitignore");
    this.copy("_gitattributes",   ".gitattributes");
    this.copy("_editorconfig",    ".editorconfig");
    this.copy("_jshintrc",        ".jshintrc");
    this.copy("_ruby-version",    ".ruby-version");
    this.copy("_scss-lint.yml",   ".scss-lint.yml");
    this.copy("_package.json",    "package.json");
    this.copy("_bowerrc",         ".bowerrc");
  },

  writeBower: function () {
    this.template("_bower.json", "bower.json");
  },

  writeIndex: function () {
    this.template("index.html", basePaths.src + "index.html");
  },

  end: function () {
    this.installDependencies();
  }

});
