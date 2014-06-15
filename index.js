/* jshint node:true */
"use strict";

var spawn = require("child_process").spawn,
	ffmpeg = spawn.bind(null, "ffmpeg"),
	fs = require("fs"),
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
		dst = getTempPath(src),
		proc = spawnWrite(src, dst, data),
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
			finish();
		}
		else {
			handleError(new Error(error.getBody().toString()));
		}
	});

	if (callback) {
		stream.on("end", callback);
		stream.on("error", callback);
	}

	function handleError(err) {
		fs.unlink(dst, function() {
			stream.emit("error", err);
		});
	}

	function finish() {
		fs.rename(dst, src, function(err) {
			if (err) {
				handleError(err);
			}
			else {
				stream.emit("end");
			}
		});
	}

	return stream;
};

var path = require("path");
function getTempPath(src) {
	var ext = path.extname(src),
		basename = path.basename(src).slice(0, -ext.length),
		newName = basename + ".ffmetadata" + ext,
		dirname = path.dirname(src),
		newPath = path.join(dirname, newName);
	return newPath;
}

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

function spawnWrite(src, dst, data) {
	// ffmpeg options
	var inputs = ["-i", src], // src input
		maps = ['-map', '0:0'], // set as the first
		args = ["-y"]; // overwrite file

	// Append files and map options if included. This is in order, which
	// describes the streams in order.
	if (data._append) {
		data._append.forEach(function(el, i) {
			i += 1;
			inputs.push('-i', el);
			maps.push("-map", i + ":0");
		});
		delete data._append;
	}

	// Copy flag in order to not transcode
	args = args.concat(inputs, maps, ["-codec", "copy"]);

	// append metadata
	Object.keys(data).forEach(function(name) {
		args.push("-metadata");
		args.push(escapeini(name) + "=" + escapeini(data[name]));
	});

	args.push(dst); // output to src path

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
