var gutil = require("gulp-util");
var assert = require('assert');
var util = require("util");
var path = require("path");
var stream = require("stream");
var split = require("../index.js");

var simpleMarker = 
`First
---
Second
---
Third`;

var numberMarker = 
`First
-42-
Second
-43-
Third
-44-`;

describe('gulp-split-marker', function() {
  describe("with default marker", function() {
    it("it should split on strings", function(done){
      var called = false;
      var stream = split("---", {});
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: Buffer.from(simpleMarker)
      }));
      var contents = [];
      stream.on("data", function(file){
        contents.push(file.contents.toString());
      });
      stream.on("end", function(){
        assert.equal(contents[0],"First\n");
        assert.equal(contents[1],"\nSecond\n");
        assert.equal(contents[2],"\nThird");
        done();
      });
    });
    it("it should split on regexps", function(done){
      var called = false;
      var stream = split(/-\d+-/, {});
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: Buffer.from(numberMarker)
      }));
      var contents = [];
      stream.on("data", function(file){
        contents.push(file.contents.toString());
      });
      stream.on("end", function(){
        assert.equal(contents[0],"First\n");
        assert.equal(contents[1],"\nSecond\n");
        assert.equal(contents[2],"\nThird\n");
        done();
      });
    });
    it("it should pass matches and index to rename option", function(done){
      var called = false;
      var stream = split(/-(\d)(\d)-/, {
        rename: function(basename, ix, match, group1, group2) {
          return ix+"-"+group1+group2+path.extname(basename)
        }
      });
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: Buffer.from(numberMarker)
      }));
      var contents = [];
      stream.on("data", function(file){
        contents.push(file.path);
      });
      stream.on("end", function(){
        assert.equal(contents[0],"/test/random/0-42.json");
        assert.equal(contents[1],"/test/random/1-43.json");
        assert.equal(contents[2],"/test/random/2-44.json");
        done();
      });
    });
  });
});