import * as Tone from 'tone';
import { RecordingType, IncompleteRecording } from '../Transport/recording';

export enum ActionType {
    setMic,
    togglePlay,
    toggleRecordingState,
    initialize,
    selectChannel,
    deselectAllChannels,
    addChannel,
    editChannelName,
    deleteSelectedChannel,
    selectRecording,
    deselectRecordings,
    scheduleNewRecording,
    switchRecordingChannel,
    deleteSelectedRecording,
    updateRecordingPosition,
    updateTransportLength,
    updateTransportPosition,
    cropRecording,
    splitRecording,
    soloRecording,
    unsoloRecording
}

export type Action = 
    { type: ActionType.togglePlay; payload: { playing: boolean; time: number; }; } |
    { type: ActionType.toggleRecordingState; payload: boolean; } |

    { type: ActionType.initialize; payload: Tone.UserMedia; } |
    { type: ActionType.addChannel; } |
    { type: ActionType.editChannelName; payload: {id: string; name: string; }; } |
    { type: ActionType.selectChannel; payload: string; } | 
    { type: ActionType.deselectAllChannels; } |
    { type: ActionType.deleteSelectedChannel; } |

    { type: ActionType.selectRecording; payload: RecordingType;} |
    { type: ActionType.deselectRecordings; } |

    { type: ActionType.scheduleNewRecording; payload: IncompleteRecording; } |
    { type: ActionType.deleteSelectedRecording; payload: RecordingType; } |
    { type: ActionType.updateRecordingPosition; payload: { r: RecordingType, pos: number; }; } |
    { type: ActionType.switchRecordingChannel; payload: { r: RecordingType; index: number; newIndex: number; }; } |
    { type: ActionType.cropRecording; payload: { r: RecordingType; left: number; right: number; }; } |
    { type: ActionType.splitRecording; payload: { r: RecordingType; split: number; }; } |
    { type: ActionType.soloRecording; payload: RecordingType; } |
    { type: ActionType.unsoloRecording; payload: RecordingType; } |
    { type: ActionType.updateTransportPosition; payload: number; }  |
    { type: ActionType.updateTransportLength; payload: number; } 



