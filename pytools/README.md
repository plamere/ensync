# pytools

Tools to support ensync.js

Use ensync_gen.py to generate the json file that is used by ensync.js


## Dependencies
This requires pyen. You can install pyen with:

`  % pip install pyen
`  

## Get an Echo Nest API key
  * Get an Echo Nest API key from [developer.echonest.com ](http://developer.echonest.com) 
  * Set your API Key as an environment variable like so:
  
  `
  	% export ECHO_NEST_API_KEY=YOUR_API_KEY
  `
  
## Usage
Generate an ensync json file as follows:

` % python ensync_gen.py path/to/song.mp3 song.json
`

## Deploy
Put the mp3 and json file on the web and load them in your web app like so:

	   ENSync.loadSongFromTRID("song.json", "song.mp3"
                
                function(song) {
                },

                function(msg) {
                	// error callback
                	error("An error occured while loading the song: " + msg);
                },

                function(percent) {
                	// progress callback
                }
            );
       



