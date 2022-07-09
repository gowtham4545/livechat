let client = AgoraRTC.createClient({ mode: 'rtc', 'codec': 'vp8' })

let config = {
    appId: '4f5f1bf38e0c440f86d3b1df203195c8',
    token: '0064f5f1bf38e0c440f86d3b1df203195c8IAANuUgURJ4Dyr7yrFtGJlV6ybMiEOiEoqM1GeqL+6PFf/xYODQAAAAAEABu1Ka5ZbjKYgEAAQBluMpi',
    uid: null,
    channel: 'livechat',
}

let localTracks = {
    audioTrack: null,
    videoTrack: null,
}

let localTrackState = {
    audioTrackMuted: false,
    videoTrackMuted: false
}

let remoteTracks = {}

document.getElementById('audio-btn').addEventListener('click', async () => {
    if (!localTrackState.audioTrackMuted) {
        await localTracks.audioTrack.setMuted(true)
        localTrackState.audioTrackMuted = true
        document.getElementById('audio-btn').style.backgroundColor='red'
    }
    else {
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('audio-btn').style.backgroundColor='#002b42'
    }
})

document.getElementById('camera-btn').addEventListener('click', async () => {
    if (!localTrackState.videoTrackMuted) {
        await localTracks.videoTrack.setMuted(true)
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor='red'
    }
    else {
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor='#002b42'
    }
})

document.getElementById('join-btn').addEventListener('click', async () => {
    console.log('User Joined Stream');
    document.getElementById('enter').style.visibility = 'hidden'
    await joinStreams()
    document.getElementById('buttons').style.visibility = 'visible'
})

let joinStreams = async () => {


    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
        client.join(config.appId, config.channel, config.token),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
    ])
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    let videoPlayer = `
    <div class="video-containers" id="video-wrapper-${config.uid}">
    <p class="user-uid">${config.uid}</p>
    <div class="video-player player" id="stream-${config.uid}"></div>
    </div>
    `

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
    localTracks.videoTrack.play(`stream-${config.uid}`)

    await client.publish([localTracks.audioTrack, localTracks.videoTrack])

}

let handleUserJoined = async (user, mediaType) => {
    console.log('User has joined our stream');
    remoteTracks[user.uid] = user

    await client.subscribe(user, mediaType);

    
    if (mediaType === 'video') {
        let videoPlayer = document.getElementById(`video-wrapper-${user.uid}`);
        if (videoPlayer) {
            videoPlayer.remove()
        }

        videoPlayer = `
        <div class="video-containers" id="video-wrapper-${user.uid}">
            <p class="user-uid">${user.uid}</p>
            <div class="video-player player" id="stream-${user.uid}"></div>
        </div>
        `

        document.getElementById('user-streams').insertAdjacentHTML('beforeend', videoPlayer)
        user.videoTrack.play(`stream-${user.uid}`)
    }
    if (mediaType === 'audio') {
        user.audioTrack.play()
    }
}
let handleUserLeft = (user) => {
    console.log('user left');
    delete remoteTracks[user.uid];
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}

document.getElementById('exit-btn').addEventListener('click', async () => {
    for (trackName in localTracks) {
        let track = localTracks[trackName]
        if (track) {
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }
    await client.leave()
    document.getElementById('enter').style.visibility = 'visible'
    document.getElementById('buttons').style.visibility = 'hidden'
    document.getElementById('user-streams').innerHTML = ''
})