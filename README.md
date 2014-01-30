# ENsync

ENsync is a high-level API for creating web apps that are synchronized to music.  It uses the detailed audio analysis data from the Echo Nest to allow for music-aware synchronization. This library is inspired by [dancer.js](http://jsantell.github.io/dancer.js/) by jsantell.

## Status
This is an early alpha version of the library. It provides for synchronization against bars, beats, tatums, sections and segments in various ways. Documentation is weak or non-existent, there are very few demos, and there are probably bugs.


## Usage
ENsync requires a song to be analyzed via the Echo Nest analyser. This analysis labels all sorts of features in the song including where all the bars, beats and tatums are. It also provides detailed information on the timbral and harmonic content of the song. The analysis is represented as a json file. This json file can be generated using the gen_ensync.js python script (found in the pytools directory). Consult the gen_ensync.js README.md for information on how to use gen_ensync.js to create the json file

## Getting Started
Here's a bit of code that will log a message every time a beat is played.

           ENSync.loadSongFromJSON("my_song.js", "my_song.mp3",
               function(song) {
                    song.sel('beats').on(
                        function(q) {
                        	console.log('beat', beat.which, 'played');
                        }
                    );
                },
            );            

## Features

 * Synchronize to any audio event (sections, bars, beats, tatums, segments)
 
## Examples and Demos
See ENsync in use on the [Examples](http://static.echonest.com/ensync/examples) page.
