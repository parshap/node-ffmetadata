/* jshint node:true */
"use strict";

var spawn = require("child_process").spawn,
	ffmpeg = spawn.bind(null, process.env.FFMPEG_PATH || "ffmpeg"),
	fs = require("fs"),
	through = require("through"),
	concat = require("concat-stream");

module.exports.setFfmpegPath = function(path) {
	ffmpeg = spawn.bind(null, path || "ffmpeg");
};

module.exports.read = function(src, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	var args = getReadArgs(src, options);

	if (options.dryRun) {
		return args;
	}

	var proc = spawnRead(args),
		stream = through(),
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

module.exports.write = function(src, data, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	var dst = getTempPath(src),
		args = getWriteArgs(src, dst, data, options);

	if (options.dryRun) {
		return args;
	}

	var proc = ffmpeg(args),
		stream = through(),
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

function getReadArgs(src, options) {
	if (typeof options.coverPath !== 'undefined' ) {
		return [
			'-i',
			src,
			options.coverPath
		];
	}

	return [
		"-i",
		src,
		"-f",
		"ffmetadata",
		"pipe:1", // output to stdout
	];
}

function spawnRead(args) {
	return ffmpeg(args, { detached: true, encoding: "binary" });
}

function getWriteArgs(src, dst, data, options) {
	// ffmpeg options
	var inputs = ["-i", src], // src input
		maps = ['-map', '0:0'], // set as the first
		args = ["-y"]; // overwrite file

	// Attach additional input files if included
	getAttachments(options).forEach(function(el) {
		var inputIndex = inputs.length / 2;
		inputs.push('-i', el);
		maps.push("-map", inputIndex + ":0");
	});

	// Copy flag in order to not transcode
	args = args.concat(inputs, maps, ["-codec", "copy"]);

	if (options["id3v1"]) {
		args.push("-write_id3v1", "1");
	}

	if (options["id3v2.3"]) {
		args.push("-id3v2_version", "3");
	}

	// append metadata
	Object.keys(data).forEach(function(name) {
		args.push("-metadata");
		args.push(escapeini(name) + "=" + escapeini(data[name]));
	});

	args.push(dst); // output to src path

	return args;
}

function getAttachments(options) {
	if (Array.isArray(options)) {
		return options;
	}
	return options.attachments || [];
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

	var key;

	function parseLine(data) {
		data = unescapeini(data);
		var index = data.indexOf("=");

		if (index === -1) {
			stream.data[key] += data.slice(index + 1);
			stream.data[key] = stream.data[key].replace('\\', '\n');
		} else {
			key = data.slice(0, index);
			stream.data[key] = data.slice(index + 1);
		}
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
