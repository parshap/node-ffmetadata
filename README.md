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

// Set the artist and cover image for song.mp3
ffmetadata.write("song.mp3", 
	artist: "Me"
}, function(err) {
	if (err) console.error("Error writing metadata");
	else console.log("Data written");
});
```
## Artwork

You can optionally include an array of files to be added to the source file. This is a destructive action, it will overwrite any previous streams on the file. For audio data, this is typically just one image. For video, this is where you would write additional audio streams or subtitle tracks.

```js
	data: {
		_append: ["cover.jpg"] // optional
	}

```
## Metadata

Other ffmpeg meta tags (for songs) might include 

```
	artist //artist name
	album //album name
	title //song title
	track //place in the album (e.g. track 5/8)
	disc //for multidisc albums
	label //record label
	date //arbitrary, but usually year (e.g. 2002)
```

# Installation

**The [*ffmpeg* command-line tool](http://www.ffmpeg.org) (or the [libav
fork](http://www.libav.org/avconv.html)) must
be installed.**

```
npm install ffmetadata
```
