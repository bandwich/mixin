import p5 from 'p5';

import { useState, useEffect, useRef, useContext } from 'react';
import * as styles from './editorStyles';
import * as Tone from 'tone';
import useDragRange from './useDragRange';
import { TRANSPORT_LENGTH } from '../utils/constants';
import { map } from '../utils/audio-utils';

import { StateDispatchContext } from '../utils/StateContext';

// recording is selectedRecording prop
function Editor({recording, solo, exporting}) {
    const dispatch = useContext(StateDispatchContext);

    const [buffer, setBuffer] = useState([]);
    const [muted, setMuted] = useState(false);
    const [highlighting, setHighlighting] = useState(false);
    const [cropLeft, setCropLeft] = useState(0);
    const [cropRight, setCropRight] = useState(0);
    const zoom = useRef(3);
    const editorRef = useRef();

    // resize canvas on window resize!
    const s = (sketch) => {
        let width = TRANSPORT_LENGTH / 2.5;
        let height = 175;
        sketch.setup = () => {
            sketch.createCanvas(width, height);
        };
        sketch.draw = () => {
            if (buffer.length === 0) {
                return;
            }
            sketch.background('#454a52');
            sketch.beginShape();
            sketch.stroke('#ced4de')

            let toneTime = Tone.Transport.seconds;
            let trueEnd = recording.position + recording.player._buffer.duration; // uncropped duration is here
            let timeScaled = sketch.map(toneTime, recording.start, recording.duration, 0, width);

            let sampleStart = Math.round(sketch.map(recording.start, recording.position, trueEnd, 0, buffer.length));
            let sampleEnd = Math.round(sketch.map(recording.duration, recording.position, trueEnd, 0, buffer.length));
            
            let i = sampleStart;
            let position = i;

            while (i < sampleEnd) {
                let sum = 0;
                let window = 100;
                for (let p = position; p < position + window; p++) {
                    sum += buffer[p] * 500;
                }
                let x = sketch.map(i, sampleStart, sampleEnd, 0, width);
                let average = (sum * 2) / window;
                sketch.vertex(x, height / 2 - average);
                i += window;
                position += window;
            }
            sketch.endShape();
            
            sketch.stroke("#868e9c");
            sketch.rect(timeScaled, 0, 1, 175, 0); // playline
        }
    };

    const checkEnabled = () => {
        return (Object.keys(recording).length && !exporting);
    };
    
    const _reset = () => {
        _clearBuffer();
        setHighlighting(false);
    };

    const _clearBuffer = () => {
        setBuffer([]);
    };

    // mutating recording state directly for Tone operations
    const mute = () => {
        if (!checkEnabled()) {
            return;
        }
        muted 
            ? recording.player.mute = false
            : recording.player.mute = true;
        setMuted(!muted);
    };

    const soloClip = () => {
        if (!checkEnabled()) {
            return;
        }
        solo(recording.solo);
    };

    // crop does not modify audio data
    // start and end points are used to calculate offset and duration for Tone player

    const cropClip = () => {
        if (!checkEnabled()) {
            return;
        }
        if (highlighting) {
            dispatch({type: 'cropRecording', payload: {
                recording, 
                leftDelta: cropLeft,
                rightDelta: cropRight,
            }});
        }
        setHighlighting(!highlighting);
    };

    const setPoints = (type, delta) => {
        delta = map(delta, 0, TRANSPORT_LENGTH / 2.5, 0, recording.duration); // get point position in seconds

        if (type == 'start') {
            setCropLeft(delta);

        } else if (type == 'end') {
            setCropRight(delta);
        }
    }

    useEffect(() => {
        console.log(buffer)
        console.log(recording)
        let waveform = new p5(s, editorRef.current);
        if (Object.keys(recording).length) {
            try {
                setBuffer(recording.player.buffer._buffer.getChannelData(0));
            } catch (e) {
                console.log(e);
            }
        } else if (buffer.length) { // if there's no recording but a buffer is still selected
            _reset();
        }
        return () => waveform.remove();
    }, [recording.start, buffer]);

    return (
        <styles.Editor>
            <styles.ControlView>
                <styles.ClipMute id="editorButton" onClick={mute} muted={muted}></styles.ClipMute>
                <styles.ClipSolo id="editorButton" onClick={soloClip} solo={recording.solo}>S</styles.ClipSolo>
                <styles.Crop id="editorButton" started={highlighting} onClick={cropClip}></styles.Crop>
            </styles.ControlView>
            <styles.EditorWaveform ref={editorRef}>
                {useDragRange(highlighting, setPoints)}
            </styles.EditorWaveform>
        </styles.Editor>
    )
}

export default Editor;