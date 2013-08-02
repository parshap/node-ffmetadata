/* jshint node:true */
"use strict";

var ffmpeg = require("child_process").spawn.bind(null, "ffmpeg"),
	through = require("through"),
	concat = require("concat-stream");

var domain = require("domain");

module.exports = function(callback) {
	var stream = through(),
		proc = spawnRead(),
		output = parseini(),
		error = concat();

	// Proxy any child process error events along
	proc.on("error", stream.emit.bind(stream, "error"));

	// Work around pipe ECONNRESET error
	proc.stdin.on("error", function(err) {
		if (err.errno !== "ECONNRESET") {
			stream.emit("error", err);
		}
	});

	proc.stdout.pipe(output);
	proc.stderr.pipe(error);

	proc.on("close", function(code) {
		if (code === 0) {
			stream.emit("metadata", output.data);
		}
		else {
			stream.emit("error", new Error(error.getBody()));
		}
	});

	stream.pipe(proc.stdin);
	stream.on("metadata", callback);
	return stream;
};

function spawnRead() {
	var args = [
		"-i",
		"pipe:0", // input from stdin
		"-f",
		"ffmetadata",
		"pipe:1", // output to stdout
	];

	return ffmpeg(args, { detached: true, encoding: "binary" });
}

// -- Parse ini

var combine = require("stream-combiner"),
	filter = require("stream-filter"),
	split = require("split");

function parseini(callback) {
	var stream = combine(
		split(),
		filter(Boolean),
		filter(isNotComment),
		through(parseLine)
	);

	// Object to store INI data in
	stream.data = {};

	if (callback) {
		stream.on("end", callback.bind(null, stream.data));
	}

	return stream;

	function parseLine(data) {
		data = unescapeini(data);
		var index = data.indexOf("=");
		stream.data[data.slice(0, index)] = data.slice(index + 1);
	}
}

function isNotComment(data) {
	return data.slice(0, 1) !== ";";
}

function unescapeini(data) {
	// @TODO
	return data;
}
