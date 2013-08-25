# node-ffmetadata

Read and write media file meta data (e.g., MP3 ID3 tags) using ffmpeg's
metadata framework.

# Example

```js
var ffmetadata = require("ffmetadata"),
	fs = require("fs");

// Read song.mp3 metadata
ffmetadata.read("song.mp3", function(err, data) {
	if (err) console.error("Error reading metadata, err");
	else console.log(data);
});

// Set the artist for song.mp3
ffmetadata.write("song.mp3", {
	artist: "Me",
}, function(err) {
	if (err) console.error("Error writing metadata");
	else console.log("Data written");
});
```

# Installation

**The [*ffmpeg* command-line tool](http://www.ffmpeg.org) (or the [libav
fork](http://www.libav.org/avconv.html)) must
be installed.**

```
npm install ffmetadata
```
