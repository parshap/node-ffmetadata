# node-ffmetadata

Read and write media file meta data (e.g., MP3 ID3 tags) using ffmpeg's
metadata framework.

# Usage

```js
var ffmetadata = require("ffmetadata");
var fs = require("fs");

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
## Artwork

You can optionally include an array of files to be added to the source
file. This is a destructive action, it will overwrite any previous
streams on the file. For audio data, this is typically just one image.
For video, this is where you would write additional audio streams or
subtitle tracks.

```js
ffmetadata.write("song.mp3", {
  _append: ["cover.jpg"] // optional
}, function(err) {
	if (err) console.error("Error writing cover art");
	else console.log("Cover art added");
});
```
## Metadata

FFmpeg meta data (for songs) might include

 * `"artist"`: artist name
 * `"album"`: album name
 * `"title"`: song title
 * `"track"`: place in the album (e.g. `"5/8"`)
 * `"disc"`: for multidisc albums
 * `"label"`: record label
 * `"date"`: arbitrary, but usually year (e.g. `"2002"`)

See [FFmpeg Metadata][] for details.

[ffmpeg metadata]: http://wiki.multimedia.cx/index.php?title=FFmpeg_Metadata

# Installation

**Dependency**: [FFmpeg][] or [libav][] must be installed on the system.
This module uses the `ffmpeg` command-line tool. Version: 0.10.

[ffmpeg]: http://www.ffmpeg.org
[libav]: http://www.libav.org/avconv.html

```
npm install ffmetadata
```
