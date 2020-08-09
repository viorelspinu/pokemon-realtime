
var lastTimeSound = (new Date()).getTime();
var recordingActive = false;

var audioData = [];
var recorder = null;
var recordingLength = 0;
var volume = null;
var mediaStream = null;
var sampleRate = 44100;
var context = null;
var blob = null;

var bufferSize = 2048;
var stopAudioListener = [];



function addStopAudioListener(f) {
  stopAudioListener.push(f);
}

function onAudioProcess(e) {
  if (!recordingActive) {
    return;
  }
  let data = e.inputBuffer.getChannelData(0);
  audioData.push(new Float32Array(data));
  recordingLength += bufferSize;
}

function convertBlobToBase64(blob, callback) {
  var reader = new window.FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function () {
    base64 = reader.result;
    base64 = base64.split(',')[1];
    callback(base64);
  }

}


function downloadAudio() {
  if (blob == null) {
    return;
  }
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "sample.wav";
  a.click();
  window.URL.revokeObjectURL(url);
}

function playAudio() {
  if (blob == null) {
    return;
  }
  var url = window.URL.createObjectURL(blob);
  var audio = new Audio(url);
  audio.play();
}



function startRecording() {

  if (recordingActive) {
    return;
  }

  recordingActive = true;

  $("#stopRecordingButton").show();
  $("#startRecordingButton").hide();


  audioData = [];
  recorder = null;
  recordingLength = 0;
  lastTimeSound = (new Date()).getTime();


  // Initialize recorder
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia(
    {
      audio: true
    },
    function (e) {
      // creates the audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      // creates an audio node from the microphone incoming stream
      mediaStream = context.createMediaStreamSource(e);
      // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
      // bufferSize: the onaudioprocess event is called when the buffer is full

      if (context.createScriptProcessor) {
        recorder = context.createScriptProcessor(bufferSize, 1, 1);
      } else {
        recorder = context.createJavaScriptNode(bufferSize, 1, 1);
      }
      recorder.onaudioprocess = function (e) {
        onAudioProcess(e);
      }

      mediaStream.connect(recorder);
      recorder.connect(context.destination);
    },
    function (e) {
      console.error(e);
    });
}



function stopRecording() {
  if (!recordingActive) {
    return;
  }

  $("#stopRecordingButton").hide();
  $("#startRecordingButton").show();

  recordingActive = false;

  recorder.disconnect(context.destination);
  mediaStream.disconnect(recorder);
  var audioBuffer = flattenArray(audioData, recordingLength);
  var interleaved = audioBuffer;
  var buffer = new ArrayBuffer(44 + interleaved.length * 2);
  var view = new DataView(buffer);
  // RIFF chunk descriptor
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 44 + interleaved.length * 2, true);
  writeUTFBytes(view, 8, 'WAVE');
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunkSize
  view.setUint16(20, 1, true); // wFormatTag
  view.setUint16(22, 1, true); // wChannels: mono (1 channel)
  view.setUint32(24, sampleRate, true); // dwSamplesPerSec
  view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
  view.setUint16(32, 4, true); // wBlockAlign
  view.setUint16(34, 16, true); // wBitsPerSample
  // data sub-chunk
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, interleaved.length * 2, true);
  // write the PCM samples
  var index = 44;
  var volume = 1;
  for (var i = 0; i < interleaved.length; i++) {
    view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
    index += 2;
  }
  // our final blob
  blob = new Blob([view], { type: 'audio/wav' });

  convertBlobToBase64(blob, function (base64) {
    for (var i = 0; i < stopAudioListener.length; i++) {
      if (typeof stopAudioListener[i] === 'function') {
        stopAudioListener[i](base64);
      }
    }
  });



}

function flattenArray(channelBuffer, recordingLength) {
  var result = new Float32Array(recordingLength);
  var offset = 0;
  for (var i = 0; i < channelBuffer.length; i++) {
    var buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function writeUTFBytes(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function averageArray(channelBuffer) {
  var sum = 0;
  for (var i = 0; i < channelBuffer.length; i++) {
    sum = sum + Math.abs(channelBuffer[i]);
  }
  var average = sum / channelBuffer.length;
  return average;

}