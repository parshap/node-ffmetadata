/* jshint node:true */
"use strict";

var spawn = require("child_process").spawn,
	ffmpeg = spawn.bind(null, "ffmpeg"),
	through = require("through"),
	concat = require("concat-stream");

module.exports.read = function(src, callback) {
	var stream = through(),
		proc = spawnRead(src),
		output = parseini(),
		error = concat();

	// Proxy any child process error events along
	proc.on("error", stream.emit.bind(stream, "error"));

	// Parse ffmetadata "ini" output
	proc.stdout.pipe(output);

	// Capture stderr
	proc.stderr.pipe(error);

	proc.on("close", function(code) {
		if (code === 0) {
			stream.emit("metadata", output.data);
		}
		else {
			stream.emit("error", new Error(error.getBody().toString()));
		}
	});

	if (callback) {
		stream.on("metadata", callback.bind(null, null));
		stream.on("error", callback);
	}

	return stream;
};

module.exports.write = function(src, data, callback) {
	var stream = through(),
		proc = spawnWrite(src, data),
		error = concat();

	// Proxy any child process error events
	proc.on("error", stream.emit.bind(stream, "error"));

	// Proxy child process stdout but don't end the stream until we know
	// the process exits with a zero exit code
	proc.stdout.on("data", stream.emit.bind(stream, "data"));

	// Capture stderr (to use in case of non-zero exit code)
	proc.stderr.pipe(error);

	proc.on("close", function(code) {
		if (code === 0) {
			stream.emit("end");
		}
		else {
			stream.emit("error", new Error(error.getBody().toString()));
		}
	});

	if (callback) {
		stream.on("end", callback);
		stream.on("error", callback);
	}

	return stream;
};

// -- Child process helpers

function spawnRead(src) {
	var args = [
		"-i",
		src,
		"-f",
		"ffmetadata",
		"pipe:1", // output to stdout
	];

	return ffmpeg(args, { detached: true, encoding: "binary" });
}

function spawnWrite(src, data) {
	var args = [
		"-y",
		"-i",
		src, // input from src path
		"-map",
		"0",
		"-codec",
		"copy",
	];

	// Write metadata
	Object.keys(data).forEach(function(name) {
		args.push("-metadata");
		args.push(escapeini(name) + "=" + escapeini(data[name]));
	});

	args.push(src); // output to src path

	return ffmpeg(args);
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

function escapeini(data) {
	// @TODO
	return data;
}

function unescapeini(data) {
	// @TODO
	return data;
}
