/* jshint node:true */
"use strict";

var spawn = require("child_process").spawn,
	ffmpeg = spawn.bind(null, "ffmpeg"),
	through = require("through"),
	concat = require("concat-stream");

var domain = require("domain");

module.exports.read = function(callback) {
	var stream = through(),
		proc = spawnRead(),
		output = parseini(),
		error = concat();

	// Proxy any child process error events along
	proc.on("error", stream.emit.bind(stream, "error"));

	// Work around pipe ECONNRESET error
	proc.stdin.on("error", function(err) {
		if (err.errno !== "ECONNRESET" && err.errno !== "EPIPE") {
			stream.emit("error", err);
		}
	});

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
		stream.on("metadata", callback);
	}

	stream.pipe(proc.stdin);
	return stream;
};

var stream = require("stream");

module.exports.write = function(data) {
	var tee = through();
	var retstream = through(function(data) {
		tee.write(data);
	}, function() {
		tee.end();
	});

	var buffer = new stream.PassThrough({ highWaterMark: Infinity });

	tee.pipe(buffer);

	var formatStream = tee.pipe(format(function(format) {
		var proc = spawnWrite(data, format.format.format_name);
		var error = concat();

		buffer.pipe(proc.stdin);

		// Work around pipe ECONNRESET error
		proc.stdin.on("error", function(err) {
			if (err.errno !== "ECONNRESET" && err.errno !== "EPIPE") {
				retstream.emit("error", err);
			}
		});

		// Proxy any child process error events
		proc.on("error", retstream.emit.bind(retstream, "error"));

		// Proxy child process stdout but don't end the stream until we know
		// the process exits with a zero exit code
		proc.stdout.on("data", retstream.emit.bind(retstream, "data"));

		// Capture stderr (to use in case of non-zero exit code)
		proc.stderr.pipe(error);

		proc.on("close", function(code) {
			if (code === 0) {
				retstream.emit("end");
			}
			else {
				retstream.emit("error", new Error(error.getBody().toString()));
			}
		});
	}));

	formatStream.on("error", retstream.emit.bind(retstream, "error"));

	return retstream;
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

function spawnWrite(data, format) {
	var args = [
		"-i",
		"pipe:0", // input from stdin
		"-codec",
		"copy",
	];

	// Write metadata
	Object.keys(data).forEach(function(name) {
		args.push("-metadata");
		args.push(escapeini(name) + "=" + escapeini(data[name]));
	});

	args.push("-f", format);

	args.push("pipe:1"); // output to stdout

	return ffmpeg(args);
}

// -- ffprobe

var format = module.exports.format = function format(callback) {
	var stream = through(),
		proc = ffprobe(),
		output = concat(),
		error = concat();

	stream.pipe(proc.stdin);
	proc.stdout.pipe(output);
	proc.stderr.pipe(error);
	proc.on("error", stream.emit.bind(stream, "error"));

	// Work around pipe ECONNRESET error
	proc.stdin.on("error", function(err) {
		if (err.errno !== "ECONNRESET" && err.errno !== "EPIPE") {
			stream.emit("error", err);
		}
	});

	proc.on("close", function(code) {
		if (code === 0) {
			stream.emit("format", JSON.parse(output.getBody().toString()));
		}
		else {
			stream.emit("error", new Error(error.getBody().toString()));
		}
	});

	if (callback) {
		stream.on("format", callback);
	}

	return stream;
};

function ffprobe() {
	var args = [
		"-print_format",
		"json",
		"-show_format",
		"pipe:0",
	];

	return spawn("ffprobe", args);
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
