import os
import pyen
import sys
import simplejson as json
import time
import urllib2

en = pyen.Pyen()

def get_analysis(trid):
    print 'getting the analysis ...'
    profile = get_profile(trid, True)
    analysis_url = profile['audio_summary']['analysis_url']
    f = urllib2.urlopen(analysis_url)
    js = f.read()
    f.close()
    analysis = json.loads(js)

    del analysis['track']['synchstring']
    del analysis['track']['codestring']
    del analysis['track']['echoprintstring']

    profile["analysis"] = analysis
    return profile

def get_profile(trid, refresh=False):
    print 'profiling track ...'
    response = en.get('track/profile', id=trid, bucket=['audio_summary'])
    profile = response['track']
    return profile

def wait_for_analysis(trid):
    print 'analysing track ...',
    status = False
    while True:
        print ".",
        response = en.get('track/profile', id=trid, bucket=['audio_summary'])
        if response['track']['status'] <> 'pending':
            status = True
            break
        time.sleep(1)
    print
    return status

def upload(path, type):
    print 'uploading track ...'
    f = open(path, 'rb')
    ret = None
    try:
        response = en.post('track/upload', track=f, filetype=type)
        trid = response['track']['id']
        ok = wait_for_analysis(trid)
        if ok:
            ret = trid
    except pyen.PyenException as e:
        print e
    f.close()
    return ret

def show_info(track):
    analysis = track['analysis']

    print 'artist:', track['artist']
    print 'title:', track['title']
    print "Analysis:  sections:%d bars:%d beats:%d tatums:%d segments:%d" % (
        len(analysis['sections']), len(analysis['bars']), len(analysis['beats']),
        len(analysis['tatums']), len(analysis['segments']))

def analyze_track(path, type='mp3'):
    track = None
    trid = upload(path, type)
    if trid:
        track = get_analysis(trid)
        show_info(track)
    return track


if __name__ == '__main__':

    if len(sys.argv) == 3:
        track = analyze_track(sys.argv[1])
        if track:
            out = open(sys.argv[2], 'w')
            print >>out, json.dumps(track)
            out.close()
        else:
            print "Can't analyze " + sys.argv[1]
    else:
        print 'usage:  %s path-to-local-mp3 output.js '

