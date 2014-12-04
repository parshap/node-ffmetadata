/* jshint node:true */
"use strict";

var path = require("path"),
	fs = require("fs"),
	through = require("through"),
	test = require("tape"),
	ffmetadata = require("../");

var TEST_FILE_ORIG = path.join(__dirname, "test.mp3"),
	TEST_FILE_ARTWORK_ORIG = path.join(__dirname, "test-artwork.mp3"),
	TEST_FILE = path.join(__dirname, "__test.mp3"),
	TEST_FILE_ARTWORK = path.join(__dirname, "__test-artwork.mp3"),
	TEST_ARTWORK = path.join(__dirname, "test-cover.jpg");

function copy(src, dst) {
	var stream = through(),
		readStream = fs.createReadStream(src),
		writeStream = fs.createWriteStream(dst);
	readStream.pipe(writeStream);
	writeStream.on("finish", stream.emit.bind(stream, "end"));
	return stream;
}

var PassThrough = require("stream").PassThrough;
function ender() {
	var stream = new PassThrough();
	var remaining = 0;
	var end = stream.end.bind(stream);
	stream.end = function() {
		remaining -= 1;
		if (remaining === 0) end();
	};
	stream.on("pipe", function() {
		remaining += 1;
	});
	stream.resume();
	return stream;
}

test("copy test files", function(t) {
	var end = ender();
	copy(TEST_FILE_ORIG, TEST_FILE).pipe(end);
	copy(TEST_FILE_ARTWORK_ORIG, TEST_FILE_ARTWORK).pipe(end);
	end.on("end", t.end.bind(t));
});

test("read metadata dry run", function(t) {
	var options = {
		dryRun: true,
	};
	var args = ffmetadata.read(TEST_FILE, options);
	t.ok(args);
	t.ok(args.length > 0);
	t.end();
});

test("read metadata", function(t) {
	ffmetadata.read(TEST_FILE, function(err, data) {
		t.ifError(err);
		t.ok(data);
		t.ok(data.artist);
		t.end();
	});
});

test("write metadata", function(t) {
	ffmetadata.write(TEST_FILE, {
		artist: "foo",
		track: "1/10",
		disc: "2/2",
	}, function(err) {
		t.ifError(err);
		ffmetadata.read(TEST_FILE, function(err, data) {
			t.ifError(err);
			t.equal(data.artist, "foo");
			t.equal(data.track, "1/10");
			t.equal(data.disc, "2/2");
			t.end();
		});
	});
});

test("write metadata with artwork", function(t) {
	var data = {
		artist: "bar",
	};
	var options = {
		attachments: [TEST_ARTWORK],
	};
	ffmetadata.write(TEST_FILE_ARTWORK, data, options, function(err) {
		t.ifError(err);
		ffmetadata.read(TEST_FILE_ARTWORK, function(err, data) {
			t.ifError(err);
			t.equal(data.artist, "bar");
			t.end();
		});
	});
});

// TODO Ensure integrity of additional streams from `options.attachments`

test("write metadata", function(t) {
	var data = {
		artist: "foo",
		track: "1/10",
		disc: "2/2",
	};
	var options = {
		"id3v2.3": true,
		dryRun: true,
	};
	var args = ffmetadata.write(TEST_FILE, data, options);
	var index = args.indexOf("-id3v2_version");
	t.notEqual(index, -1);
	t.equal(args[index + 1], "3");
	t.end();
});
