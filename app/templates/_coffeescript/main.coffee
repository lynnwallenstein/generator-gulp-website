# CoffeeScript
# jshint devel:true
"use strict";

$ ->
  # Remove Preload so that transitions work after page loads
  $("body").removeClass("preload");
