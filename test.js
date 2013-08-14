/* jshint node:true */
"use strict";

var path = require("path"),
	fs = require("fs"),
	ffmetadata = require("./"),
	assert = require("assert");

var files = process.argv.slice(2);

files.forEach(function(file) {
	fs.createReadStream(file)
		.pipe(ffmetadata.write({
			artist: "foo",
		}))
		.on("error", console.log.bind(console))
		.pipe(ffmetadata.read(function(data) {
			if (data.artist === "foo") {
				console.log("success", file);
			}
			else {
				console.log("fail", file);
			}
		}))
		.on("error", console.log.bind(console));
});
