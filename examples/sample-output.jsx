/**
 * Magic MultiCam - Automated Multi-Camera Editor
 * Generated: 2024-01-15T10:30:00.000Z
 *
 * This script automates multi-camera editing in Adobe Premiere Pro
 * by switching camera angles based on audio analysis.
 *
 * IMPORTANT: This script uses ExtendScript (ES3). No modern JS syntax allowed.
 */

/**
 * Cut List Preview:
 * ==================
 *   1. 00:00:00:00 → Camera 1 (speaker_change, 1 active)
 *   2. 00:00:05:12 → Camera 2 (speaker_change, 1 active)
 *   3. 00:00:12:08 → Camera 1 (speaker_change, 1 active)
 *   4. 00:00:18:20 → Camera 3 (multi_speaker, 2 active)
 *   5. 00:00:22:15 → Camera 2 (speaker_change, 1 active)
 */

function validateSequence() {
    if (!app.project.activeSequence) {
        alert("Error: No active sequence found. Please open a sequence and try again.");
        return false;
    }

    var seq = app.project.activeSequence;
    var videoTracks = seq.videoTracks;

    if (videoTracks.numTracks === 0) {
        alert("Error: No video tracks found in sequence.");
        return false;
    }

    if (0 >= videoTracks.numTracks) {
        alert("Error: Video track index 0 does not exist.");
        return false;
    }

    return true;
}

function processMultiCamEdits() {
    // Get active sequence
    var seq = app.project.activeSequence;
    var videoTrack = seq.videoTracks[0];
    // Process each clip in the video track
    var numClips = videoTrack.clips.numItems;

    for (var i = 0; i < numClips; i++) {
        var clip = videoTrack.clips[i];

        // Check if clip is a multi-camera source
        if (clip.isMulticamClip && clip.isMulticamClip()) {
            var qeClip = qe.project.getActiveSequence().getVideoTrackAt(0).getItemAt(i);

            // Apply camera switches at specified timecodes
            var cuts = [
                {time: "0", camera: 0},
                {time: "1320844800000", camera: 1},
                {time: "3048201600000", camera: 0},
                {time: "4775558400000", camera: 2},
                {time: "5741049600000", camera: 1}
            ];

            for (var j = 0; j < cuts.length; j++) {
                var cutData = cuts[j];
                qeClip.setMultiCameraChannel(cutData.camera, cutData.time);
            }
        }
    }

    alert("Multi-camera editing complete! Applied 5 cuts.");
}

if (validateSequence()) {
    processMultiCamEdits();
}
