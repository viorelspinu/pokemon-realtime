assistantIsPlaying = false;

function initWebsocket() {
  var scheme = window.location.protocol == "https:" ? 'wss://' : 'ws://';
  var webSocketUri = scheme
    + window.location.hostname
    + (location.port ? ':' + location.port : '')
    + '/chat';

  websocket = new WebSocket(webSocketUri);

  websocket.onopen = function () {
    console.log('Connected');
  };

  websocket.onclose = function () {    
    console.log('Closed');
    initWebsocket();
  };

  websocket.onmessage = function (e) {
    var text = e.data;

    if (text.startsWith("___STT_TEXT_RESPONSE___")) {
      text = text.replace("___STT_TEXT_RESPONSE___", "");    
      $("#recognized").html(text);
      computeCounterPokemon(text);
    }

    if (text.startsWith("___POKEMON_NAME_MP3___")) {
      text = text.replace("___POKEMON_NAME_MP3___", "");
      
      window.mp3 = new Audio('data:audio/mp3;base64,' + text)
      mp3.onended = function () {
        assistantIsPlaying = false;
      }
      mp3.onplay = function () {
        assistantIsPlaying = true;
      }
      mp3.play();
    }


  };

  websocket.onerror = function (e) {
    console.log(e);
  };
}

