# node-ffmetadata

Read and write media file meta data (e.g., MP3 ID3 tags) using ffmpeg's
metadata framework.

**Known issue with embedded images:** ffmpeg seems to have an issue
when the input contains images embedded in the audio file (e.g., album
artwork). See this [*ffmpeg-users* post](http://ffmpeg.org/pipermail/ffmpeg-user/2013-August/016667.html)
for more information.

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
