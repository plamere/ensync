


var ENSync = { REVISION: '1.0', } ;

(function() {
    function getAudioContext() {
        if (window.webkitAudioContext) {
            return new webkitAudioContext();
        } else {
            return new AudioContext();
        }
    }
    ENSync.audioContext = getAudioContext();
})();

ENSync.isReady = function() {
    return ENSync.audioContext != null;
}

ENSync.Qlist = function(songData) {
    // songData:
    //  is the track portion of the track/profile result with 2 additional fields
    //      analysis - the full analysis
    //      info - track info including url to  mp3
    this.songData = songData;
    this.list = [];
}


ENSync.loadJSON = function(path, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}


ENSync.loadSongFromJSON = function(urlToJson, urlToMp3, done, error, progress) {
    var url = 'http://static.echonest.com/infinite_jukebox_data/' + trid + '.json';

    ENSync.loadJSON(url,
        function(data) {
            var song = new ENSync.Song(data.response.track);
            data.response.track.info.url = urlToMp3;
            ENSync.fetchAudio(data.response.track.info.url, function(code, audioBuffer, percent) {
                if (code == 1) {
                    song.audioBuffer = audioBuffer;
                    if (done) {
                        done(song);
                    }
                } else if (code == -1) {
                    if (error) {
                        error('trouble loading audio');
                    }
                } else if (code == 0) {
                    if (progress) {
                        progress(percent);
                    }
                }
            });
        },
        function() {
            if (error) {
                error('trouble loading track');
            }
        }
    );
}

ENSync.loadSongFromTRID = function(trid, done, error, progress) {
    var url = 'http://static.echonest.com/infinite_jukebox_data/' + trid + '.json';

    ENSync.loadJSON(url,
        function(data) {
            var song = new ENSync.Song(data.response.track);
            ENSync.fetchAudio(data.response.track.info.url, function(code, audioBuffer, percent) {
                if (code == 1) {
                    song.audioBuffer = audioBuffer;
                    if (done) {
                        done(song);
                    }
                } else if (code == -1) {
                    if (error) {
                        error('trouble loading audio');
                    }
                } else if (code == 0) {
                    if (progress) {
                        progress(percent);
                    }
                }
            });
        },
        function() {
            if (error) {
                error('trouble loading track');
            }
        }
    );
}

ENSync.fetchAudio = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
        ENSync.audioContext.decodeAudioData(request.response, 
            function(buffer) {      // completed function
                callback(1, buffer, 100);
            }, 
            function(e) { // error function
                callback(-1, null, 0);
            }
        );
    }

    request.onerror = function(e) {
        callback(-1, null, 0);
    }

    request.onprogress = function(e) {
        var percent = Math.round(e.position * 100  / e.totalSize);
        callback(0, null, percent);
    }
    request.send();
}


ENSync.Qlist.prototype = {
    constructor:ENSync.Qlist,

    _push: function(q) {
        this.list.push(q);
    },

    _starts_in: function(q) {
        for (var i = 0; i < this.list.length; i++) {
            var container = this.list[i];
            if  (q.start >= container.start && q.start < container.start + container.duration) {
                return true;
            }
        }
        return false;
    },

    sel: function(cls) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        if (cls == 'fade-in') {
            qlist._push({start:0, duration:this.songData.track.end_of_fade_in});
        } else if (cls == 'fade-out') {
            qlist._push({start:this.songData.track.start_of_fade_out, 
                    duration:this.songData.track.duration - this.songData.track.start_of_fade_out});
        } else {
            this.songData.analysis[cls].forEach( function(q, which) {
                if (that._starts_in(q)) {
                    qlist._push(q);
                }
            });
        }
        return qlist;
    },

    get: function(which)  {
        var qlist = new ENSync.Qlist(this.songData);
        if (this.list.length > which) {
            qlist._push(this.list[which]);
        }
        return qlist;
    },


    first: function(cls) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        this.list.forEach(
            function(q, which) {
                ovlps = that._findOverlap(q, cls)
                if (ovlps.length > 0) {
                    qlist._push(ovlps[0]);
                }
            }
        );
        return qlist;
    },

    last: function(cls) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        this.list.forEach(
            function(q, which) {
                ovlps = that._findOverlap(q, cls)
                if (ovlps.length > 0) {
                    qlist._push(ovlps[ovlps.length - 1]);
                }
            }
        );
        return qlist;
    },

    highest: function(cls, field, num) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        this.list.forEach(
            function(q, which) {
                var ovlps = that._findOverlap(q, cls)
                ovlps.sort(function(a,b) {
                    return a[field] - b[field];
                });
                ovlps.reverse();
                ovlps = ovlps.slice(0, num);
                ovlps.forEach(function(q) {
                    qlist._push(q);
                });
            }
        );
        return qlist;
    },

    lowest: function(cls, field, num) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        this.list.forEach(
            function(q, which) {
                var ovlps = that._findOverlap(q, cls)
                ovlps.sort(function(a,b) {
                    return a[field] - b[field];
                });
                ovlps = ovlps.slice(0, num);
                ovlps.forEach(function(q) {
                    qlist._push(q);
                });
            }
        );
        return qlist;
    },

    in_range: function(cls, field, low, high) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        this.list.forEach(
            function(q, which) {
                var ovlps = that._findOverlap(q, cls)
                ovlps.forEach(function(q) {
                    if (q[field] >= low && q[field] <= high) {
                        qlist._push(q);
                    }
                });
            }
        );
        return qlist;
    },

    every: function(cls, step, start, end) {
        var that = this;
        var qlist = new ENSync.Qlist(this.songData);

        if (step == undefined) {
            step = 1;
        }

        if (start == undefined) {
            start = 0;
        }

        if (end == undefined) {
            end = 0;
        }

        this.list.forEach(
            function(q, which) {
                ovlps = that._findOverlap(q, cls)
                if (ovlps.length > 0) {
                    var tStart = start;
                    var tEnd = end;

                    if (tStart < 0) {
                        tStart = ovlps.length + tStart;
                    }

                    if (tEnd <= 0) {
                        tEnd = ovlps.length + tEnd;
                    }

                    for (var i = tStart; i < tEnd; i += step) {
                        if (i >= 0 && i < ovlps.length) {
                            qlist._push(ovlps[i]);
                        }
                    }
                }
            }
        );
        return qlist;
    },

    _findOverlap: function(parentQ, cls) {
        var ovlp = [];
        var pend = parentQ.start + parentQ.duration;
        this.songData.analysis[cls].forEach( function(q, which) {
            if (q.start >= parentQ.start && q.start < pend) {
                ovlp.push(q);
            }
        });
        return ovlp;
    },

    time_range:function(start, end) {
        var qlist = new ENSync.Qlist(this.songData);
        this.list.forEach( function(q, which) {
            if (q.start >= start && q.start + q.duration < end) {
                qlist._push(q);
            }
        });
        return qlist;
    },

    on: function(func, offset) {
        var that = this;

        if (offset == undefined) {
            offset = 0;
        }

        this.list.forEach(function(q) {
            var qfunc = { time:q.start + offset, q:q, func:func };
            that.songData.playlist.push(qfunc);
        });
        return this;
    },

    after: function(func, offset) {
        var that = this;

        if (offset == undefined) {
            offset = 0;
        }

        this.list.forEach(function(q) {
            var qfunc = { time:q.start + q.duration + offset, q:q, func:func };
            that.songData.playlist.push(qfunc);
        });

        return this;
    }
}


ENSync.Song = function(songData) {
    ENSync.Qlist.call(this, songData);
    songData.playlist = [];
    this._push( {start:0, duration:this.songData.analysis.track.duration, confidence:1.0 } );


    function preprocessQuanta() {
        var types = ['sections', 'bars', 'beats', 'tatums', 'segments'];

        types.forEach(function(type, i) {
            songData.analysis[type].forEach(function(q, i, qlist) {
                q.which = i;
                if (i > 0) {
                    q.prev = qlist[i-1];
                } else {
                    q.prev = null
                }
                
                if (i < qlist.length - 1) {
                    q.next = qlist[i+1];
                } else {
                    q.next = null
                }
            });
        });
    }

    function connectAllOverlappingSegments(quanta_name) {
        var last = 0;
        var quanta = songData.analysis[quanta_name];
        var segs = songData.analysis.segments;

        for (var i = 0; i < quanta.length; i++) {
            var q = quanta[i]
            q.overlappingSegments = [];

            for (var j = last; j < segs.length; j++) {
                var qseg = segs[j];
                // seg ends before quantum so no
                if ((qseg.start + qseg.duration) < q.start) {
                    continue;
                }
                // seg starts after quantum so no
                if (qseg.start > (q.start + q.duration)) {
                    break;
                }
                last = j;
                q.overlappingSegments.push(qseg);
            }
        }
    }

    function connectQuanta(parent, child) {
        var qparents = songData.analysis[parent];
        var qchildren = songData.analysis[child];

        qparents.forEach( function(qparent, i, parents) {
            qparent.children = [];

            qchildren.forEach(function(qchild, j) {
                if (qchild.start >= qparent.start && qchild.start < qparent.start + qparent.duration) {
                    qchild.parent = qparent;
                    qchild.indexInParent = qparent.children.length;
                    qparent.children.push(qchild);
                } 
            });
        });
    }

    function interp(val, min, max) {
        if (min == max) {
            return min;
        } else {
            return (val - min) / (max - min);
        }
    }

    function average_volume(q) {
        var sum = 0;
        if (q.loudness_max !== undefined) {
            return q.loudness_max;
        } else if (q.overlappingSegments.length > 0) {
            q.overlappingSegments.forEach( 
                function(seg, i) {
                    sum += seg.loudness_max;
                }
            );
            return sum / q.overlappingSegments.length;
        } else {
            return -60;
        }
    }

    function calcWindowMedian(quanta, field, name, windowSize) {
        songData.analysis[quanta].forEach(function(q) {
            var vals = [];
            for (var i = 0; i < windowSize; i++) {
                var offset = i - Math.floor(windowSize / 2);
                var idx = q.which - offset;
                if (idx >= 0 && idx < songData.analysis[quanta].length) {
                    var val = songData.analysis[quanta][idx][field]
                    vals.push(val);
                }
            }
            vals.sort();
            var median =  vals[Math.floor(vals.length / 2)];
            q[name] = median;
        });
    }

    function calcDelta(quanta, field, name) {
        songData.analysis[quanta].forEach(
            function(q, j) {
                if (q.prev) {
                    q[name] = q[field] - q.prev[field];
                } else {
                    q[name] = q[field];
                }
            }
        );
    }

    function assignNormalizedVolumes(qname) {

        var minV = 0;
        var maxV = -60;

        songData.analysis[qname].forEach(
            function(q, j) {
                var vol = average_volume(q);
                q.raw_volume = vol;
                if (vol > maxV) {
                    maxV = vol;
                }
                if (vol < minV) {
                    minV = vol;
                }
            }
        );

        songData.analysis[qname].forEach(
            function(q, j) {
                q.volume = interp(q.raw_volume, minV, maxV);
            }
        );

        calcWindowMedian(qname, 'volume', 'median_volume', 10);
        calcDelta(qname, 'median_volume', 'delta_median_volume');
    }

    function processSong() {
        var start = new Date().getTime();
        preprocessQuanta();
        connectQuanta('sections', 'bars');
        connectQuanta('bars', 'beats');
        connectQuanta('beats', 'tatums');
        connectQuanta('tatums', 'segments');

        connectAllOverlappingSegments('sections');
        connectAllOverlappingSegments('bars');
        connectAllOverlappingSegments('beats');
        connectAllOverlappingSegments('tatums');

        assignNormalizedVolumes('sections');
        assignNormalizedVolumes('bars');
        assignNormalizedVolumes('beats');
        assignNormalizedVolumes('tatums');
        assignNormalizedVolumes('segments');
        var done = new Date().getTime();
        console.log("Song processed in " + (done - start) + " ms");
    }
    processSong();

}

ENSync.Song.prototype = Object.create( ENSync.Qlist.prototype);

ENSync.Song.prototype.now = function() {
    return ENSync.audioContext.currentTime - this.startTime;
}


ENSync.Song.prototype.slew = function(secs) {
    this.stop();
    this.play(secs);
}


ENSync.Song.prototype.play = function(startTime) {
    if (startTime === undefined) {
        startTime = 0;
    }

    if (this.source == null) {

        this.songData.playlist.sort(function(a,b) {
            return a.time - b.time;
        });

        var curIndex = 0;
        var that = this;
        this.startTime = ENSync.audioContext.currentTime - startTime;
        var minSyncWindow = .005;

        function scheduleCallbacks() {
            if (that.source) {
                var curTime = that.now();

                while (curIndex < that.songData.playlist.length) {
                    var event = that.songData.playlist[curIndex];
                    var when = event.time - curTime;
                    if (when < minSyncWindow) {
                        event.func(event.q, event, curTime);
                        curIndex++;
                    } else {
                        // console.log('tmo', Math.round(curTime * 1000), Math.round(when * 1000));
                        that.timer = setTimeout(scheduleCallbacks, when * 1000);
                        break;
                    }
                }
            }
        }

        this.source = ENSync.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(ENSync.audioContext.destination);


        this.source.start(0, startTime);
        scheduleCallbacks();
    }
}

ENSync.Song.prototype.stop = function() {
    if (this.source) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.source.stop(0);
        this.source = null;
    }
}
