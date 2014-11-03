"use strict";
var util = require("util");
var path = require("path");
var yeoman = require("yeoman-generator");
var yosay = require("yosay");

var GulpWebsiteGenerator = yeoman.generators.Base.extend({

  initializing: function () {
    this.pkg = require("../package.json");
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      "Welcome Lynn\'s Yeoman web site generator!"
    ));

    var prompts = [{
      name: "websiteName",
      message: "What is your website\'s name ?"
    }];

    this.prompt(prompts, function (props) {
      this.someOption = props.someOption;

      done();
    }.bind(this));
  },

  writing: {

    gulpfile: function() {
      this.template('gulpfile.js');
    },

    app: function () {
      this.dest.mkdir("app");
      this.dest.mkdir("app/templates");
      this.dest.mkdir("app/coffeescript");
      this.dest.mkdir("app/sass");
      this.dest.mkdir("app/img");
      this.dest.mkdir("app/css");
      this.dest.mkdir("app/js");
      this.dest.mkdir("app/fonts");

      this.src.copy("_package.json", "package.json");
      this.src.copy("bowerrc", ".bowerrc");
      this.src.copy("_bower.json", "bower.json");
    },

    sitemeta: function () {
      this.src.copy("favicon.ico", "app/favicon.ico");
      this.src.copy("robots.txt", "app/robots.txt");
      this.src.copy("humans.txt", "app/humans.txt");
    },

    projectfiles: function () {
      this.src.copy("editorconfig", ".editorconfig");
      this.src.copy("jshintrc", ".jshintrc");
      this.src.copy("_scss-lint.yml", ".scss-lint.yml");
    }

  },

  end: function () {
    this.installDependencies();
  }
});

module.exports = GulpWebsiteGenerator;
