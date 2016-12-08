'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var Path = require("path");
var PLUGIN_NAME = "gulp-split-marker";

module.exports = function (pattern, opts) {
  let regex;
  if(pattern instanceof RegExp) 
    regex = new RegExp(pattern.source, pattern.flags.replace(/[gm]/,"")+"gm");
  else if(typeof(pattern) === "string") 
    regex = new RegExp(pattern.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'),"gm");
  else 
    throw new gutil.PluginError(PLUGIN_NAME, "Expected either a RegExp or string for pattern");

  let defaults = {
    rename: function() { return null }
  }

	opts = Object.assign({}, defaults, opts);
	return through.obj(function (file, enc, cb) {
    var self = this;

		if (file.isNull()) {
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		}

    try {
      let source = file.contents.toString();
      let out, match, ptr = 0, count = 0;
      while((match = regex.exec(source))!==null) {
        if(!opts.includeEmptySegments && match.index-ptr == 0) {
          ptr += match.index+match[0].length;
          continue;
        }

        out = file.clone({contents: false});
        out.basename = opts.rename.apply(null, [].concat.apply([out.basename, count], match)) || out.basename;
        out.contents = Buffer.from(source.substring(ptr, match.index));
        this.push(out);
        ptr = regex.lastIndex;
        count++;
      }
      out = file.clone({contents: false});
      out.basename = opts.rename.apply(null, [].concat.apply([out.basename, count], match)) || out.basename;
      out.contents = Buffer.from(source.substring(ptr));
      cb(null, out);
    } catch (err) {
      return cb(new gutil.PluginError(PLUGIN_NAME, err));
    }
	});
};