# node-ffmetadata

Read and write media file meta data (e.g., MP3 ID3 tags) using ffmpeg's
metadata framework.

# Example

```js
var ffmetadata = require("ffmetadata"),
	fs = require("fs");

// Read song.mp3 metadata
fs.createReadStream("song.mp3")
	.pipe(ffmetadata(function(data) {
		console.log(data);
	}))
	.on("error", function() {
		console.error("Error getting metadata");
	});

// Set the artist for song.mp3
fs.createReadStream("song.mp3")
	.pipe(ffmetadata({
		artist: "Me",
	}))
	.pipe(fs.createWriteStream("song.mp3"))
```
