/* jshint node:true */
"use strict";

var path = require("path"),
	fs = require("fs"),
	test = require("tape"),
	ffmetadata = require("../");

var TEST_FILE = path.join(__dirname, "test.mp3"),
	TEST_FILE_ARTWORK = path.join(__dirname, "test-artwork.mp3");

test("read metadata", function(t) {
	fs.createReadStream(TEST_FILE)
		.pipe(ffmetadata.read(function(data) {
			t.ok(data);
			t.ok(data.artist);
			t.end();
		}));
});

test("write metadata", function(t) {
	fs.createReadStream(TEST_FILE)
		.pipe(ffmetadata.write({
			artist: "foo",
		}))
		.pipe(ffmetadata.read(function(data) {
			t.equal(data.artist, "foo");
			t.end();
		}));
});

test("write metadata with artwork", function(t) {
	fs.createReadStream(TEST_FILE_ARTWORK)
		.pipe(ffmetadata.write({
			artist: "foo",
		}))
		.pipe(ffmetadata.read(function(data) {
			t.equal(data.artist, "foo");
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
