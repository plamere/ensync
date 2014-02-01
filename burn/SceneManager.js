

function SceneManager(song, events) {
    var _scenes = [];
    var _song = song;

    function getActiveScenes() {
        return _.filter(_scenes, function(scene) { return scene.active; } );
    }

    if ('beats' in events) {
        _song.sel('beats').on( function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.beat) {
                    scene.scene.beat(q);
                }
            });
        });
    }


    if ('prebeats' in events) {
        var prebeat = events['prebeats'];
        _song.sel('beats').on( function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.prebeat) {
                    scene.scene.prebeat(q);
                }
            }, prebeat);
        });
    }

    if ('bars' in events) {
        _song.sel('bars').on(function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.bar) {
                    scene.scene.bar(q);
                }
            });
        });
    }

    if ('tatums' in events) {
        _song.sel('tatums').on(function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.tatum) {
                    scene.scene.tatum(q);
                }
            });
        });
    }

    if ('segments' in events) {
        _song.sel('segments').on(function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.segment) {
                    scene.scene.segment(q);
                }
            });
        });
    }

    if ('presegments' in events) {
        var presegment = events['presegments'];
        _song.sel('segments').on(function(q) {
            _.each(getActiveScenes(), function(scene, which) {
                if (scene.scene.presegment) {
                    scene.scene.presegment(q);
                }
            });
        }, -presegment);
    }

    return {

        addScene: function(scene) {
            _scenes.push(scene)
        },

        addScenes: function(scene) {
            _scenes.push.apply(_scenes, scene)
        },

        start: function() {
            _.each(_scenes, function(scene, i) {
                scene.active = false;
            });
            _song.play();
        },

        stop: function() {
            _song.stop();
        },

        update:function() {
            if (_song.isPlaying()) {
                var now = _song.now();
                _.forEach(_scenes, function(scene, i) {
                    if (now >= scene.start && now < scene.start + scene.duration) {
                        if (!scene.active) {
                            scene.active = true;
                            if (scene.scene.start) {
                                scene.scene.start(scene.start, scene.duration);
                            }
                        } else {
                            if (scene.scene.update) {
                                scene.scene.update();
                            }
                        }
                    }  else {
                        if (scene.active) {
                            if (scene.scene.stop) {
                                scene.scene.stop();
                            }
                            scene.active = false;
                        }
                    }
                });
            }
        }
    }
}

function getSampleScenes() {
    var sampleScene = [
        {
            start:0,
            duration: 10,
            scene:SampleScene('test1')
        },
        {
            start:0,
            duration: 60,
            scene:SampleScene('test2')
        },
        {
            start:5,
            duration: 20,
            scene:SampleScene('test3')
        },
        {
            start:40,
            duration: 20,
            scene:SampleScene('test4')
        }
    ];
    return sampleScene;
}


function SampleScene(name) {
    var _name = name;
    var beat = 0;
    var bar = 0;

    return {
        'start': function(start, duration) {
            console.log('start', name);
        },

        'stop': function() {
            console.log('stop', name);
        },

        'update': function() {
            // console.log('update', name);
        },

        'bar': function(q) {
            bar++;
            console.log('bar', name, q.which, bar);
        },

        'beat': function(q) {
            beat++;
            // console.log('beat', name, q.which, beat);
        },

        'tatum': function(q) {
            // console.log('tatum', name, q.which);
        },

        'section': function(q) {
            console.log('section', name, q.which);
        },

        'segment': function(q) {
            // console.log('segment', name, q.which);
        },
    }
}
