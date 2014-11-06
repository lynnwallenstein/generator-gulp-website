"use strict";
var util = require("util");
var path = require("path");
var yeoman = require("yeoman-generator");
var yosay = require("yosay");
var wiredep = require('wiredep');

var GulpWebsiteGenerator = yeoman.generators.Base.extend({

  initializing: function () {
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

  writing: {

    gulpfile: function() {
      this.template("gulpfile.js");
    },

    app: function () {
      this.dest.mkdir("app");
      this.dest.mkdir("app/partials");
      this.dest.mkdir("app/img");
      this.dest.mkdir("app/css");
      this.dest.mkdir("app/js");
      this.dest.mkdir("app/fonts");

      this.directory("_sass", "sass");
      this.directory("_coffeescript", "coffeescript");

      this.copy("favicon.ico",    "app/favicon.ico");
      this.copy("robots.txt",     "app/robots.txt");
      this.copy("humans.txt",     "app/humans.txt");

      this.copy("gitignore",      ".gitignore");
      this.copy("gitattributes",  ".gitattributes");
      this.copy("editorconfig",   ".editorconfig");
      this.copy("jshintrc",       ".jshintrc");
      this.copy("_scss-lint.yml", ".scss-lint.yml");
      this.copy("_package.json",  "package.json");
      this.copy("bowerrc",        ".bowerrc");
    },

    writeBower: function () {
      this.bowerFile = this.src.read("_bower.json");
      this.bowerFile = this.engine(this.bowerFile, this);
      this.write("bower.json", this.bowerFile);
    },

    writeIndex: function () {
      this.indexFile = this.src.read("index.html");
      this.indexFile = this.engine(this.indexFile, this);
      this.write("app/index.html", this.indexFile);
    }

  },

  end: function () {
    this.installDependencies();
  }

});

module.exports = GulpWebsiteGenerator;
