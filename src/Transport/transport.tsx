import { useRef, useEffect, useContext, useState, MutableRefObject, KeyboardEvent, Dispatch, ReactElement} from 'react';
import p5 from 'p5';

import * as styles from './Styles/transportStyles';

import { Transport as ToneTransport } from 'tone';
import { AppTheme } from '../View/Themes';

import Channel from './channel';
import Recording, { RecordingType } from "./recording";
import Playline from './Playline';

import { existsRecording, _findChannelIndex } from '../Reducer/AppReducer';
import { State } from '../Reducer/ReducerTypes';
import { Action, ActionType } from '../Reducer/ActionTypes';

import { modulo } from '../utils/audio-utils';
import { CHANNEL_SIZE, PIX_TO_TIME, TIMELINE_HEIGHT } from '../utils/constants';

import { StateContext, StateDispatchContext } from '../utils/StateContext';
import { SnapContext } from './SnapContext';
import { DraggableData, DraggableEvent } from 'react-draggable';

interface TransportProps {
    exporting: boolean;
}

type DragData = {
    x: number;
    y: number;
}

function Transport({exporting}: TransportProps) {

    const transportRef = useRef<HTMLDivElement>(null);
    const state = useContext(StateContext) as unknown as State;
    const dispatch = useContext(StateDispatchContext) as unknown as Dispatch<Action>;

    const [snapState, setSnapState] = useState(false);
    const draggingRef = useRef(false);

    const _getGridHeight = (): number => {
        return TIMELINE_HEIGHT + (CHANNEL_SIZE * state.channels.length);
    };

    const onStop = (data: DraggableData, recording: RecordingType): void => {
        // onDrag
        if (draggingRef.current) {
            draggingRef.current = false;
            updatePlayerPosition({x: data.x, y: data.y}, recording);
        }

      // onClick
        else {
            dispatch({type: ActionType.selectRecording, payload: recording})
        }
    };

    const onDrag = (e: DraggableEvent): void => {
        if (e.type === 'mousemove' || e.type === 'touchmove') {
            draggingRef.current = true;
        }
    };

    const updatePlayerPosition = (deltas: DragData, r: RecordingType): void => {
        dispatch({type: ActionType.updateRecordingPosition, payload: {
            r: r,
            pos: deltas.x
        }});
        let index = _findChannelIndex(state.channels, r.channel)
        let newIndex = Math.floor(deltas.y / CHANNEL_SIZE);
        if (newIndex != index) {
            r.channel = state.channels[newIndex].id;
            dispatch({type: ActionType.switchRecordingChannel, payload: {
                r: r,
                index: index,
                newIndex: newIndex
            }})
        }
    };

    const TransportSettings = (setExporting: (e: boolean) => void) => {

        const settingsRef = useRef() as MutableRefObject<HTMLDivElement>;
        useOutsideSettings(settingsRef);

        function useOutsideSettings(ref: MutableRefObject<HTMLDivElement>) {
            useEffect(() => {
                function handleClickOutside(event: globalThis.MouseEvent) {
                    if (ref.current && !ref.current.contains(event.target as Node)) {
                        if (event.target instanceof Element && event.target.id != "recordingsview") {
                            return;
                        }
                        // clicked outside
                        setExporting(!exporting);
                    }
                }
                document.addEventListener("mousedown", (e) => handleClickOutside(e));
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }, [ref]);
        }
        return (
            <styles.TransportSettings>
                <styles.LengthView>
                    <styles.LengthLabel>Length:</styles.LengthLabel>
                    <styles.LengthInput id="transport_length_input" onKeyDown={handleKeyDown}
                    placeholder={(state.transportLength / PIX_TO_TIME).toString()}>
                    </styles.LengthInput>s
                </styles.LengthView>
                <styles.SnapView>
                    <p>Snap</p>
                    <styles.SnapToggle snapState={snapState}
                    onClick={() => setSnapState(!snapState)}>
                    </styles.SnapToggle>
                </styles.SnapView>
            </styles.TransportSettings>
        );
    };

    const Channels = () => {
        return state.channels.map((c, index) => (
            <Channel key={(c.id + index).toString()} 
                channelData = {{...c, index: index}}/>
        ));
    };

    const Recordings = () => {
        let recordings: ReactElement[] = [];
        state.channels.map((c) => {
            c.recordings.map((r) => {
                recordings.push(
                    <Recording key={r.id} r={r}
                        onDrag={(e: DraggableEvent) => onDrag(e)}
                        onStop={(data: DraggableData, r: RecordingType) => onStop(data, r)}
                        selected={state.selectedRecording}
                        channelIndex={c.index}
                    />
                )
             })
        });
        return (
            <styles.Recordings id="recordings_view"
                height={_getGridHeight() - TIMELINE_HEIGHT}>
                {recordings}
            </styles.Recordings>
        );
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key == 'Enter') {
            let input = document.getElementById("transport_length_input") as HTMLInputElement;
            dispatch(({type: ActionType.updateTransportLength, payload: parseInt(input.value) * PIX_TO_TIME}));
        }
    };

    useEffect(() => {
        const s = (sketch: p5) => {
            let x = state.transportLength;
            let y = TIMELINE_HEIGHT;

            sketch.setup = () => {
                sketch.createCanvas(x, y);
            };

            sketch.draw = () => {
                sketch.background(AppTheme.AppSecondaryColor);
                sketch.fill(51)
                sketch.textSize(12);

                sketch.line(0, 0, x, 0); // baseline

                let i = 0;
                while (i < x) {
                    sketch.fill(AppTheme.AppTextColor);
                    if (modulo(i, 50) == 0) {
                    if (i != 0) {
                        sketch.text(i / PIX_TO_TIME, i, y - 20); // seconds
                    }
                    sketch.line(i + 0.5, y - 50, i + 0.5, y - 40); // dashes
                    } else {
                        sketch.line(i + 0.5, y - 50, i + 0.5, y - 45); // dashes
                    }
                    sketch.stroke(206, 212, 222, 20);
                    sketch.textAlign(sketch.CENTER);
                    i += 25;
                }
            };

            sketch.mouseClicked = () => {
                // if mouse out of bounds
                if (sketch.mouseY < 0 || sketch.mouseY > y || exporting) {
                    return;
                }
                ToneTransport.pause();
                
                let newPosition = (sketch.mouseX + 1) / PIX_TO_TIME;
                if (newPosition < 0.1) {
                    newPosition = 0;
                }

                ToneTransport.seconds = newPosition;
                dispatch({type: ActionType.updateTransportPosition, payload: newPosition});
            }
        };
        if (transportRef.current) {
            let transportp5 = new p5(s, transportRef.current);
            return () => transportp5.remove();
        }
    }, [state.transportLength]);

    return (
        <styles.Wrap length={state.transportLength}>
            <styles.TransportView>
                <styles.ChannelHeaders>
                {Channels()}
                    <styles.TimelinePadding id="timeline_padding">
                        <styles.AddChannelButton onClick={() => dispatch({type: ActionType.addChannel})}>
                        </styles.AddChannelButton>
                    </styles.TimelinePadding>
                </styles.ChannelHeaders>
                <styles.GridArea id="grid_area" length={state.transportLength}>
                    <SnapContext.Provider value={snapState}>
                        <Recordings></Recordings>
                    </SnapContext.Provider>
                    <styles.Transport>
                        <styles.Timeline id="timeline" ref={transportRef}>
                            <Playline height={_getGridHeight()}></Playline>
                        </styles.Timeline>
                    </styles.Transport>
                </styles.GridArea>
            </styles.TransportView>
        </styles.Wrap>
    );
}

export default Transport;