import toWav from 'audiobuffer-to-wav';
import * as Tone from 'tone';

export const bufferToWav = (buffer) => {
    return toWav(buffer);
}

export const createPlayer = (data) => {
    return new Tone.Player({
      url: data,
      loop: false
    }).sync();
};

export const bufferFromToneBuffer = (toneBuffer) => {
    return toneBuffer._buffer;
};

export const modulo = (n, d) => {
    return ((n % d) + d) % d;
};

export const map = (val, start1, end1, start2, end2) => {
    let newVal = (val - start1) * (end2 - start2) / (end1 - start1) + start1;
    return Math.min(Math.max(newVal, start2) , end2);
}

// export const concat = (one, space, two) => {
//     let newLength = one.length + two.length;
//     let newArray = one.map(function(array, channel) {
//         let newChannelArray = new Float32Array(newLength);
//         newChannelArray.set(array);
//         newChannelArray.set(two[channel], newChannelArray.length); // concat two onto the end
//         return newChannelArray;
//     })
// }

// export const fromArray = (array, sampleRate) => {
//     let audioBuffer = new AudioBuffer({
//         length: 44100, 
//         numberOfChannels: 2, 
//         sampleRate: SAMPLE_RATE
//     });
//     // array.forEach(function(channelArray) {
//     //     if (!(channelArray instanceof Float32Array)) {
//     //         channelArray = new Float32Array(channelArray);
//     //     }
//     //     console.log(channelArray);
//     // })
// }
