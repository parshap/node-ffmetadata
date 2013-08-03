/* jshint node:true */
"use strict";

var path = require("path"),
	fs = require("fs"),
	test = require("tape"),
	ffmetadata = require("../");

var TEST_FILE = path.join(__dirname, "test.mp3");

test("read metadata", function(t) {
	fs.createReadStream(TEST_FILE)
		.pipe(ffmetadata(function(data) {
			t.ok(data);
			t.ok(data.artist);
			t.ok(data.disc);
			t.ok(data.encoded_by);
			t.end();
		}));
});

test("get format data", function(t) {
	fs.createReadStream(TEST_FILE)
		.pipe(ffmetadata.format(function(data) {
			t.ok(data);
			t.end();
		}));
});
